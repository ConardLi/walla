/**
 * 消息流 Store
 *
 * 聚合 agent_message_chunk / agent_thought_chunk / user_message_chunk
 * 管理每个会话的消息列表
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import { cleanErrorMessage } from "@/lib/error-utils";
import type { MessageRole, Message, PromptState } from "@/types/message";

interface MessageState {
  /** sessionId → messages */
  messagesBySession: Record<string, Message[]>;
  /** sessionId → prompt state */
  promptStates: Record<string, PromptState>;
  /** 正在回放历史的 session 集合 */
  replayingSessions: Set<string>;

  getMessages: (sessionId: string) => Message[];
  getPromptState: (sessionId: string) => PromptState;
  isReplaying: (sessionId: string) => boolean;
  setReplaying: (sessionId: string) => void;
  clearReplaying: (sessionId: string) => void;

  sendPrompt: (
    sessionId: string,
    text: string,
    options?: {
      resourceLinks?: Array<{ uri: string; name?: string; mimeType?: string }>;
      images?: Array<{ data: string; mimeType: string }>;
    },
  ) => Promise<void>;
  cancelPrompt: (sessionId: string) => Promise<void>;

  appendChunk: (sessionId: string, role: MessageRole, text: string) => void;
  finalizeStreaming: (sessionId: string) => void;
  addUserMessage: (sessionId: string, text: string) => void;
  addToolCallMessage: (
    sessionId: string,
    toolCall: {
      toolCallId: string;
      title: string;
      kind?: string;
      status: string;
      rawInput?: Record<string, unknown>;
    },
  ) => void;
  updateToolCallMessage: (
    sessionId: string,
    update: {
      toolCallId: string;
      title?: string;
      status?: string;
      rawInput?: Record<string, unknown>;
      content?: Array<{
        type: string;
        content?: { type: string; text?: string };
      }>;
    },
  ) => void;
  clearSession: (sessionId: string) => void;
  reset: () => void;
}

let msgIdCounter = 0;
function nextMsgId() {
  return `msg-${++msgIdCounter}-${Date.now()}`;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesBySession: {},
  promptStates: {},
  replayingSessions: new Set(),

  getMessages: (sessionId) => {
    return get().messagesBySession[sessionId] ?? [];
  },

  getPromptState: (sessionId) => {
    return (
      get().promptStates[sessionId] ?? { isPrompting: false, stopReason: null }
    );
  },

  isReplaying: (sessionId) => {
    return get().replayingSessions.has(sessionId);
  },

  setReplaying: (sessionId) => {
    set((state) => {
      const next = new Set(state.replayingSessions);
      next.add(sessionId);
      return { replayingSessions: next };
    });
  },

  clearReplaying: (sessionId) => {
    set((state) => {
      const next = new Set(state.replayingSessions);
      next.delete(sessionId);
      return { replayingSessions: next };
    });
  },

  addUserMessage: (sessionId, text) => {
    const msg: Message = {
      id: nextMsgId(),
      sessionId,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: [...(state.messagesBySession[sessionId] ?? []), msg],
      },
    }));
  },

  sendPrompt: async (sessionId, text, options) => {
    const { addUserMessage } = get();
    addUserMessage(sessionId, text);

    set((state) => ({
      promptStates: {
        ...state.promptStates,
        [sessionId]: { isPrompting: true, stopReason: null },
      },
    }));

    try {
      const prompt: Array<
        | { type: "text"; text: string }
        | { type: "image"; data: string; mimeType: string }
        | {
            type: "resource_link";
            uri: string;
            name?: string;
            mimeType?: string;
          }
      > = [{ type: "text" as const, text }];
      if (options?.images) {
        for (const img of options.images) {
          prompt.push({
            type: "image" as const,
            data: img.data,
            mimeType: img.mimeType,
          });
        }
      }
      if (options?.resourceLinks) {
        for (const link of options.resourceLinks) {
          prompt.push({
            type: "resource_link" as const,
            uri: link.uri,
            name: link.name,
            mimeType: link.mimeType,
          });
        }
      }

      const result = await ipc.sessionPrompt({ sessionId, prompt });

      // 先标记 prompt 结束，再 finalize streaming
      // 顺序很重要：防止迟到的 chunk 在 finalizeStreaming 之后到达时
      // 因 isPrompting 仍为 true 而创建新的 isStreaming 消息
      set((state) => ({
        promptStates: {
          ...state.promptStates,
          [sessionId]: {
            isPrompting: false,
            stopReason: result.stopReason,
            usage: result.usage,
          },
        },
      }));

      const { finalizeStreaming } = get();
      finalizeStreaming(sessionId);
    } catch (err) {
      const errMessage =
        cleanErrorMessage((err as Error).message) || "未知错误";

      // 先标记 prompt 结束，再 finalize streaming（同上，防止竞态）
      set((state) => ({
        promptStates: {
          ...state.promptStates,
          [sessionId]: {
            isPrompting: false,
            stopReason: `error: ${errMessage}`,
          },
        },
      }));

      const { finalizeStreaming } = get();
      finalizeStreaming(sessionId);

      // 插入一条错误消息到聊天列表
      const errorMsg: Message = {
        id: nextMsgId(),
        sessionId,
        role: "error",
        content: errMessage,
        timestamp: Date.now(),
      };
      set((state) => ({
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: [
            ...(state.messagesBySession[sessionId] ?? []),
            errorMsg,
          ],
        },
      }));
    }
  },

  cancelPrompt: async (sessionId) => {
    try {
      await ipc.sessionCancel({ sessionId });
    } catch {
      // cancel 是 best-effort
    }
  },

  appendChunk: (sessionId, role, text) => {
    // 只过滤空字符串；保留换行等空白字符，它们是 Markdown 排版的一部分
    if (!text) return;

    const replaying = get().replayingSessions.has(sessionId);

    set((state) => {
      const msgs = [...(state.messagesBySession[sessionId] ?? [])];

      // 回放模式：每个 chunk 是一条完整的独立消息，不合并
      if (replaying) {
        msgs.push({
          id: nextMsgId(),
          sessionId,
          role,
          content: text,
          timestamp: Date.now(),
          isStreaming: false,
        });
        return {
          messagesBySession: {
            ...state.messagesBySession,
            [sessionId]: msgs,
          },
        };
      }

      // 实时流式模式：向后搜索同 role 且仍在 streaming 的消息进行追加
      // 允许跳过中间的 tool 消息，避免 agent→tool→agent 导致同一回复被拆成两条
      let targetIdx = -1;
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i];
        // 跳过 tool 消息
        if (m.role === "tool") continue;
        // 找到同 role 且仍在 streaming 的消息
        if (m.role === role && m.isStreaming) {
          targetIdx = i;
        }
        // 遇到非 tool 消息就停止搜索（无论是否匹配）
        break;
      }

      if (targetIdx >= 0) {
        // 追加到现有流式消息
        msgs[targetIdx] = {
          ...msgs[targetIdx],
          content: msgs[targetIdx].content + text,
        };
      } else {
        // 创建新的流式消息
        // 防止竞态：如果 prompt 已结束（finalizeStreaming 已执行），
        // 迟到的 chunk 不应标记 isStreaming，否则会永远卡在 streaming 状态
        const prompting = state.promptStates[sessionId]?.isPrompting ?? false;
        msgs.push({
          id: nextMsgId(),
          sessionId,
          role,
          content: text,
          timestamp: Date.now(),
          isStreaming: prompting,
        });
      }

      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: msgs,
        },
      };
    });
  },

  finalizeStreaming: (sessionId) => {
    set((state) => {
      const msgs = (state.messagesBySession[sessionId] ?? []).map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m,
      );
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: msgs,
        },
      };
    });
  },

  addToolCallMessage: (sessionId, toolCall) => {
    const msg: Message = {
      id: nextMsgId(),
      sessionId,
      role: "tool",
      content: toolCall.title,
      timestamp: Date.now(),
      toolCallId: toolCall.toolCallId,
      toolTitle: toolCall.title,
      toolKind: toolCall.kind,
      toolStatus: toolCall.status,
      toolInput: toolCall.rawInput,
    };
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: [...(state.messagesBySession[sessionId] ?? []), msg],
      },
    }));
  },

  updateToolCallMessage: (sessionId, update) => {
    set((state) => {
      const existing = state.messagesBySession[sessionId] ?? [];
      const found = existing.some(
        (m) => m.role === "tool" && m.toolCallId === update.toolCallId,
      );

      if (found) {
        // 更新已有的 tool 消息
        const msgs = existing.map((m) => {
          if (m.role === "tool" && m.toolCallId === update.toolCallId) {
            return {
              ...m,
              toolTitle: update.title ?? m.toolTitle,
              toolStatus: update.status ?? m.toolStatus,
              toolInput: update.rawInput ?? m.toolInput,
              toolContent: update.content
                ? [...(m.toolContent ?? []), ...update.content]
                : m.toolContent,
              content: update.title ?? m.content,
            };
          }
          return m;
        });
        return {
          messagesBySession: {
            ...state.messagesBySession,
            [sessionId]: msgs,
          },
        };
      }

      // 历史回放时 tool_call_update 可能直接到达（无 tool_call），创建新消息
      const msg: Message = {
        id: nextMsgId(),
        sessionId,
        role: "tool",
        content: update.title ?? "Tool Call",
        timestamp: Date.now(),
        toolCallId: update.toolCallId,
        toolTitle: update.title,
        toolStatus: update.status,
        toolInput: update.rawInput,
        toolContent: update.content,
      };
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: [...existing, msg],
        },
      };
    });
  },

  clearSession: (sessionId) => {
    set((state) => {
      const { [sessionId]: _, ...rest } = state.messagesBySession;
      return { messagesBySession: rest };
    });
  },

  reset: () => {
    set({
      messagesBySession: {},
      promptStates: {},
      replayingSessions: new Set(),
    });
  },
}));
