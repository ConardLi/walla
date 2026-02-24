/**
 * Chat 模式状态管理 Store
 *
 * 完全独立于 Agent 模式的 session-store / message-store
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type {
  ChatMessage,
  ChatConversation,
  ChatModelSettings,
} from "@/types/chat";
import { DEFAULT_CHAT_SETTINGS } from "@/types/chat";
import { useTokenUsageStore } from "@/stores/token-usage-store";

export type ChatConvGroupMode = "time" | "model";
export type ChatConvSortMode = "created" | "updated";
export type ChatConvViewMode = "normal" | "compact";

const STORAGE_NAMESPACE = "chat";
const CONVERSATIONS_KEY = "conversations";
const SETTINGS_KEY = "settings";
const SELECTED_MODEL_KEY = "selected-model";

let idCounter = 0;
function genId() {
  return `chat-${Date.now()}-${++idCounter}`;
}

interface ChatState {
  /** 所有对话 */
  conversations: ChatConversation[];
  /** 当前激活的对话 ID */
  activeConversationId: string | null;
  /** 当前选中的提供商 ID */
  selectedProviderId: string;
  /** 当前选中的模型 ID */
  selectedModelId: string;
  /** 模型设置 */
  settings: ChatModelSettings;
  /** 是否正在流式生成 */
  isStreaming: boolean;
  /** 当前流式请求 ID */
  activeRequestId: string | null;
  /** 是否已加载 */
  loaded: boolean;
  /** 分组模式 */
  groupMode: ChatConvGroupMode;
  /** 排序模式 */
  sortMode: ChatConvSortMode;
  /** 视图模式 */
  viewMode: ChatConvViewMode;

  /** 加载持久化数据 */
  load: () => Promise<void>;
  /** 新建对话 */
  newConversation: () => void;
  /** 切换对话 */
  switchConversation: (id: string) => void;
  /** 删除对话 */
  removeConversation: (id: string) => void;
  /** 切换收藏状态 */
  toggleFavorite: (id: string) => void;
  /** 设置分组模式 */
  setGroupMode: (mode: ChatConvGroupMode) => void;
  /** 设置排序模式 */
  setSortMode: (mode: ChatConvSortMode) => void;
  /** 设置视图模式 */
  setViewMode: (mode: ChatConvViewMode) => void;
  /** 设置选中的模型 */
  setSelectedModel: (providerId: string, modelId: string) => void;
  /** 更新模型设置 */
  updateSettings: (settings: Partial<ChatModelSettings>) => void;
  /** 发送消息 */
  sendMessage: (content: string) => Promise<void>;
  /** 追加流式文本到最后一条 assistant 消息 */
  appendStreamChunk: (requestId: string, text: string) => void;
  /** 追加思考过程文本到最后一条 assistant 消息 */
  appendReasoningChunk: (requestId: string, text: string) => void;
  /** 流式结束 */
  finishStream: (
    requestId: string,
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
  ) => void;
  /** 流式错误 */
  handleStreamError: (requestId: string, error: string) => void;
  /** 取消当前流式请求 */
  cancelStream: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  selectedProviderId: "",
  selectedModelId: "",
  settings: { ...DEFAULT_CHAT_SETTINGS },
  isStreaming: false,
  activeRequestId: null,
  loaded: false,
  groupMode: "time",
  sortMode: "updated",
  viewMode: "compact",

  load: async () => {
    try {
      const [convRes, settingsRes, modelRes] = await Promise.all([
        ipc.storageGet({
          namespace: STORAGE_NAMESPACE,
          key: CONVERSATIONS_KEY,
        }),
        ipc.storageGet({ namespace: STORAGE_NAMESPACE, key: SETTINGS_KEY }),
        ipc.storageGet({
          namespace: STORAGE_NAMESPACE,
          key: SELECTED_MODEL_KEY,
        }),
      ]);

      const conversations = (convRes.value ?? []) as ChatConversation[];
      const settings = settingsRes.value
        ? {
            ...DEFAULT_CHAT_SETTINGS,
            ...(settingsRes.value as Partial<ChatModelSettings>),
          }
        : { ...DEFAULT_CHAT_SETTINGS };
      const modelSelection = (modelRes.value ?? {}) as {
        providerId?: string;
        modelId?: string;
      };

      set({
        conversations,
        settings,
        selectedProviderId: modelSelection.providerId ?? "",
        selectedModelId: modelSelection.modelId ?? "",
        loaded: true,
      });

      // 加载各对话的累计 token 消耗
      const tokenUsageStore = useTokenUsageStore.getState();
      await Promise.all(
        conversations.map((c) => tokenUsageStore.loadSessionUsage(c.id)),
      );
    } catch {
      set({ loaded: true });
    }
  },

  newConversation: () => {
    const { selectedProviderId, selectedModelId } = get();
    const conv: ChatConversation = {
      id: genId(),
      title: "新对话",
      messages: [],
      providerId: selectedProviderId,
      modelId: selectedModelId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({
      conversations: [conv, ...s.conversations],
      activeConversationId: conv.id,
    }));
    persistConversations(get().conversations);
  },

  switchConversation: (id) => {
    set({ activeConversationId: id });
  },

  toggleFavorite: (id) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, favorited: !c.favorited } : c,
      ),
    }));
    persistConversations(get().conversations);
  },

  setGroupMode: (mode) => set({ groupMode: mode }),
  setSortMode: (mode) => set({ sortMode: mode }),
  setViewMode: (mode) => set({ viewMode: mode }),

  removeConversation: (id) => {
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const activeConversationId =
        s.activeConversationId === id
          ? (conversations[0]?.id ?? null)
          : s.activeConversationId;
      return { conversations, activeConversationId };
    });
    persistConversations(get().conversations);
  },

  setSelectedModel: (providerId, modelId) => {
    set({ selectedProviderId: providerId, selectedModelId: modelId });
    ipc.storageSet({
      namespace: STORAGE_NAMESPACE,
      key: SELECTED_MODEL_KEY,
      value: { providerId, modelId },
    });
  },

  updateSettings: (partial) => {
    const settings = { ...get().settings, ...partial };
    set({ settings });
    ipc.storageSet({
      namespace: STORAGE_NAMESPACE,
      key: SETTINGS_KEY,
      value: settings,
    });
  },

  sendMessage: async (content) => {
    const state = get();
    let conv = state.conversations.find(
      (c) => c.id === state.activeConversationId,
    );

    // 如果没有活跃对话，自动创建一个
    if (!conv) {
      get().newConversation();
      conv = get().conversations.find(
        (c) => c.id === get().activeConversationId,
      );
      if (!conv) return;
    }

    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    const requestId = genId();

    // 更新对话标题（第一条消息时）
    const isFirstMessage = conv.messages.length === 0;
    const title = isFirstMessage
      ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
      : conv.title;

    // 添加用户消息和空的 assistant 消息
    const updatedMessages = [...conv.messages, userMsg, assistantMsg];
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conv!.id
          ? { ...c, messages: updatedMessages, title, updatedAt: Date.now() }
          : c,
      ),
      isStreaming: true,
      activeRequestId: requestId,
    }));

    // 构建消息列表用于 API 调用
    const apiMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];
    if (state.settings.systemPrompt) {
      apiMessages.push({
        role: "system",
        content: state.settings.systemPrompt,
      });
    }
    for (const m of conv.messages) {
      if (m.role === "user" || m.role === "assistant") {
        apiMessages.push({ role: m.role, content: m.content });
      }
    }
    apiMessages.push({ role: "user", content });

    // 获取模型配置 —— 从 model-store 中查找
    const { useModelStore } = await import("@/stores/model-store");
    const providers = useModelStore.getState().providers;

    // 使用对话上的 providerId/modelId，如果没有则用全局选中的
    const providerId = conv.providerId || state.selectedProviderId;
    const modelId = conv.modelId || state.selectedModelId;
    const provider = providers.find((p) => p.id === providerId);

    if (!provider) {
      get().handleStreamError(
        requestId,
        "未找到对应的模型提供商，请先选择模型",
      );
      return;
    }

    // 查找模型配置，获取可能覆盖的 type
    const modelConfig = provider.models.find((m) => m.id === modelId);
    const providerType = modelConfig?.type || provider.type;

    await ipc.llmChatStream({
      requestId,
      type: providerType,
      model: modelId,
      apiKey: provider.apiKey,
      baseURL: provider.apiHost,
      messages: apiMessages,
      temperature: state.settings.temperature,
      topP: state.settings.topP,
      maxTokens: state.settings.maxTokens,
      frequencyPenalty: state.settings.frequencyPenalty,
      presencePenalty: state.settings.presencePenalty,
    });
  },

  appendStreamChunk: (requestId, text) => {
    if (get().activeRequestId !== requestId) return;
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== s.activeConversationId) return c;
        const msgs = [...c.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant" && last.isStreaming) {
          msgs[msgs.length - 1] = {
            ...last,
            content: last.content + text,
            isReasoningStreaming: false,
          };
        }
        return { ...c, messages: msgs };
      }),
    }));
  },

  appendReasoningChunk: (requestId, text) => {
    if (get().activeRequestId !== requestId) return;
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== s.activeConversationId) return c;
        const msgs = [...c.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant" && last.isStreaming) {
          msgs[msgs.length - 1] = {
            ...last,
            reasoning: (last.reasoning ?? "") + text,
            isReasoningStreaming: true,
          };
        }
        return { ...c, messages: msgs };
      }),
    }));
  },

  finishStream: (requestId, usage) => {
    if (get().activeRequestId !== requestId) return;
    const state = get();
    const activeConvId = state.activeConversationId;
    set((s) => ({
      isStreaming: false,
      activeRequestId: null,
      conversations: s.conversations.map((c) => {
        if (c.id !== s.activeConversationId) return c;
        const msgs = [...c.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant" && last.isStreaming) {
          msgs[msgs.length - 1] = {
            ...last,
            isStreaming: false,
            isReasoningStreaming: false,
          };
        }
        return { ...c, messages: msgs, updatedAt: Date.now() };
      }),
    }));
    persistConversations(get().conversations);

    // 记录 Token 消耗
    if (usage && activeConvId) {
      const conv = get().conversations.find((c) => c.id === activeConvId);
      useTokenUsageStore.getState().recordUsage(
        activeConvId,
        {
          totalTokens: usage.totalTokens,
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
        },
        {
          agentName: "Chat",
          modelId: conv?.modelId,
          modelName: conv?.modelId,
        },
      );
    }
  },

  handleStreamError: (requestId, error) => {
    if (get().activeRequestId !== requestId) return;
    set((s) => {
      const conversations = s.conversations.map((c) => {
        if (c.id !== s.activeConversationId) return c;
        const msgs = [...c.messages];
        const last = msgs[msgs.length - 1];
        // 移除空的 streaming assistant 消息
        if (
          last &&
          last.role === "assistant" &&
          last.isStreaming &&
          !last.content
        ) {
          msgs.pop();
        } else if (last && last.role === "assistant" && last.isStreaming) {
          msgs[msgs.length - 1] = { ...last, isStreaming: false };
        }
        // 添加错误消息
        msgs.push({
          id: genId(),
          role: "error",
          content: error,
          timestamp: Date.now(),
        });
        return { ...c, messages: msgs, updatedAt: Date.now() };
      });
      return { conversations, isStreaming: false, activeRequestId: null };
    });
    persistConversations(get().conversations);
  },

  cancelStream: () => {
    const { activeRequestId } = get();
    if (activeRequestId) {
      ipc.llmChatCancel(activeRequestId);
      set((s) => ({
        isStreaming: false,
        activeRequestId: null,
        conversations: s.conversations.map((c) => {
          if (c.id !== s.activeConversationId) return c;
          const msgs = [...c.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant" && last.isStreaming) {
            if (!last.content) {
              msgs.pop();
            } else {
              msgs[msgs.length - 1] = { ...last, isStreaming: false };
            }
          }
          return { ...c, messages: msgs };
        }),
      }));
      persistConversations(get().conversations);
    }
  },
}));

async function persistConversations(conversations: ChatConversation[]) {
  await ipc.storageSet({
    namespace: STORAGE_NAMESPACE,
    key: CONVERSATIONS_KEY,
    value: conversations,
  });
}
