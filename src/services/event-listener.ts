/**
 * IPC 事件 → Zustand Store 桥接
 *
 * 监听主进程推送的事件，分发到对应的 Store
 */

import { isElectron } from "./ipc-client";
import * as ipc from "./ipc-client";
import { useAgentStore } from "@/stores/agent-store";
import { useSessionStore } from "@/stores/session-store";
import { useMessageStore } from "@/stores/message-store";
import type { Message } from "@/types/message";
import { useToolCallStore } from "@/stores/tool-call-store";
import { useUpdateLogStore } from "@/stores/update-log-store";

type RawInput = Record<string, unknown>;

let initialized = false;
const cleanups: Array<() => void> = [];

export function initEventListeners(): void {
  if (initialized || !isElectron()) return;
  initialized = true;

  // Agent 状态变更
  cleanups.push(
    ipc.onAgentStatusChange((data) => {
      useAgentStore.getState().setStatus(data as never);
    }),
  );

  // 会话更新（核心分发）
  cleanups.push(
    ipc.onSessionUpdate((data) => {
      const notification = data as unknown as {
        sessionId: string;
        update: Record<string, unknown>;
      };
      const { sessionId, update } = notification;
      const updateType = update.sessionUpdate as string;

      // 记录原始日志
      useUpdateLogStore.getState().addEntry({
        sessionId,
        direction: "receive",
        category: "event",
        method: updateType,
        raw: notification,
      });

      switch (updateType) {
        case "agent_message_chunk": {
          const content = update.content as { type: string; text?: string };
          if (content.type === "text" && content.text) {
            useMessageStore
              .getState()
              .appendChunk(sessionId, "agent", content.text);
          }
          break;
        }

        case "agent_thought_chunk": {
          const content = update.content as { type: string; text?: string };
          if (content.type === "text" && content.text) {
            useMessageStore
              .getState()
              .appendChunk(sessionId, "thought", content.text);
          }
          break;
        }

        case "user_message_chunk": {
          const content = update.content as { type: string; text?: string };
          if (content.type === "text" && content.text) {
            useMessageStore
              .getState()
              .appendChunk(sessionId, "user", content.text);
          }
          break;
        }

        case "tool_call": {
          useToolCallStore.getState().addToolCall(sessionId, {
            toolCallId: update.toolCallId as string,
            title: update.title as string,
            kind: update.kind as string | undefined,
            status: update.status as string,
          });
          useMessageStore.getState().addToolCallMessage(sessionId, {
            toolCallId: update.toolCallId as string,
            title: update.title as string,
            kind: update.kind as string | undefined,
            status: update.status as string,
            rawInput: update.rawInput as RawInput | undefined,
          });
          break;
        }

        case "tool_call_update": {
          useToolCallStore.getState().updateToolCall(sessionId, {
            toolCallId: update.toolCallId as string,
            status: update.status as string | undefined,
            content: update.content as never,
          });
          useMessageStore.getState().updateToolCallMessage(sessionId, {
            toolCallId: update.toolCallId as string,
            title: update.title as string | undefined,
            status: update.status as string | undefined,
            rawInput: update.rawInput as RawInput | undefined,
            content: update.content as Message["toolContent"],
          });
          break;
        }

        case "current_mode_update": {
          useSessionStore
            .getState()
            .updateSessionModes(sessionId, update.currentModeId as string);
          break;
        }

        case "config_option_update": {
          useSessionStore
            .getState()
            .updateSessionConfig(sessionId, update.configOptions as never);
          break;
        }

        case "available_commands_update": {
          const cmds = update.availableCommands as Array<{
            name: string;
            description: string;
          }>;
          useSessionStore
            .getState()
            .updateSessionCommands(sessionId, cmds as never);
          // 同步写入 agent-store 缓存
          useAgentStore.getState().setCachedCommands(cmds);
          break;
        }

        case "session_info_update": {
          const title = update.title as string | null | undefined;
          console.log(
            `[EventListener] session_info_update: sessionId=${sessionId}, title=${JSON.stringify(title)}`,
          );
          if (title) {
            useSessionStore.getState().updateSessionTitle(sessionId, title);
          }
          break;
        }

        case "plan": {
          // plan updates 也记录到 tool call store 作为特殊条目
          break;
        }

        default: {
          console.log(
            `[EventListener] unhandled sessionUpdate: ${updateType}`,
            JSON.stringify(update).slice(0, 200),
          );
          break;
        }
      }
    }),
  );

  // 权限请求 → 存到全局 store（由 PermissionDialog 消费）
  cleanups.push(
    ipc.onPermissionRequest((data) => {
      usePermissionQueue.getState().enqueue(data as PermissionRequest);
    }),
  );

  // 操作确认请求 → 存到确认队列（由 OperationConfirmDialog 消费）
  cleanups.push(
    ipc.onOperationConfirm((data) => {
      const event = data as {
        confirmId: string;
        operation: string;
        description: string;
        detail?: Record<string, unknown>;
      };
      useOperationConfirmQueue.getState().enqueue(event);
    }),
  );

  console.log("[EventListener] Initialized");
}

export function destroyEventListeners(): void {
  for (const cleanup of cleanups) {
    cleanup();
  }
  cleanups.length = 0;
  initialized = false;
}

// ============ 权限请求队列（独立小 Store）============

import { create } from "zustand";

export interface PermissionRequest {
  requestId: string;
  sessionId: string;
  toolCall: {
    title: string;
    kind?: string;
    rawInput?: unknown;
    [key: string]: unknown;
  };
  options: Array<{ optionId: string; name: string; kind: string }>;
}

/**
 * 提取工具身份标识（用于批量响应匹配）
 * 相同 title + kind 视为同一类工具
 */
export function getToolIdentity(req: PermissionRequest): string {
  return `${req.toolCall.kind ?? ""}:${req.toolCall.title}`;
}

/**
 * 记录用户的 allow_always / reject_once 决定
 * key: toolIdentity, value: optionKind
 * 后续同类请求入队时自动响应，无需再弹窗
 */
const autoDecisions = new Map<string, string>();

interface PermissionQueueState {
  queue: PermissionRequest[];
  enqueue: (req: PermissionRequest) => void;
  dequeue: () => PermissionRequest | undefined;
  respond: (requestId: string, optionId: string | null) => Promise<void>;
  respondAndBatch: (
    requestId: string,
    optionId: string,
    optionKind: string,
  ) => Promise<void>;
  clearAutoDecisions: () => void;
}

export const usePermissionQueue = create<PermissionQueueState>((set, get) => ({
  queue: [],

  enqueue: (req) => {
    const identity = getToolIdentity(req);
    const decidedKind = autoDecisions.get(identity);
    if (decidedKind) {
      // 已有自动决定，直接响应不入队
      const matchingOpt = req.options.find((o) => o.kind === decidedKind);
      if (matchingOpt) {
        ipc.permissionResponse({
          requestId: req.requestId,
          outcome: { outcome: "selected", optionId: matchingOpt.optionId },
        });
        return;
      }
    }
    set((state) => ({ queue: [...state.queue, req] }));
  },

  dequeue: () => {
    const { queue } = get();
    if (queue.length === 0) return undefined;
    const [first, ...rest] = queue;
    set({ queue: rest });
    return first;
  },

  respond: async (requestId, optionId) => {
    const outcome = optionId
      ? { outcome: "selected" as const, optionId }
      : { outcome: "cancelled" as const };
    await ipc.permissionResponse({ requestId, outcome });
    set((state) => ({
      queue: state.queue.filter((r) => r.requestId !== requestId),
    }));
  },

  respondAndBatch: async (requestId, optionId, optionKind) => {
    const { queue } = get();
    const current = queue.find((r) => r.requestId === requestId);
    if (!current) return;

    // 响应当前请求
    await ipc.permissionResponse({
      requestId,
      outcome: { outcome: "selected", optionId },
    });

    const removedIds = new Set<string>([requestId]);

    if (optionKind === "allow_always" || optionKind === "reject_once") {
      const identity = getToolIdentity(current);
      // 记录决定，后续同类请求入队时自动响应
      autoDecisions.set(identity, optionKind);

      // 批量处理队列中已有的同类请求
      const similar = queue.filter(
        (r) => r.requestId !== requestId && getToolIdentity(r) === identity,
      );
      for (const req of similar) {
        const matchingOpt = req.options.find((o) => o.kind === optionKind);
        if (matchingOpt) {
          await ipc.permissionResponse({
            requestId: req.requestId,
            outcome: { outcome: "selected", optionId: matchingOpt.optionId },
          });
          removedIds.add(req.requestId);
        }
      }
    }

    set((state) => ({
      queue: state.queue.filter((r) => !removedIds.has(r.requestId)),
    }));
  },

  clearAutoDecisions: () => {
    autoDecisions.clear();
  },
}));

// ============ 操作确认队列（独立小 Store）============

export interface OperationConfirm {
  confirmId: string;
  operation: string;
  description: string;
  detail?: Record<string, unknown>;
}

interface OperationConfirmQueueState {
  queue: OperationConfirm[];
  enqueue: (req: OperationConfirm) => void;
  respond: (confirmId: string, approved: boolean) => Promise<void>;
}

export const useOperationConfirmQueue = create<OperationConfirmQueueState>(
  (set) => ({
    queue: [],

    enqueue: (req) => {
      set((state) => ({ queue: [...state.queue, req] }));
    },

    respond: async (confirmId, approved) => {
      await ipc.operationConfirmResponse({ confirmId, approved });
      set((state) => ({
        queue: state.queue.filter((r) => r.confirmId !== confirmId),
      }));
    },
  }),
);
