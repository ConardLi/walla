/**
 * Chat 逻辑 Hook
 *
 * 封装消息列表、prompt 状态、发送/取消等逻辑
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useMessageStore } from "@/stores/message-store";
import { useSessionStore } from "@/stores/session-store";
import {
  useAgentStore,
  selectStatus,
  selectAnyReady,
} from "@/stores/agent-store";
import { useTokenUsageStore } from "@/stores/token-usage-store";
import { useSettingsStore } from "@/stores/settings-store";

export function useChat() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);
  const persistCurrentSession = useSessionStore((s) => s.persistCurrentSession);
  const agentStatus = useAgentStore(selectStatus);
  const anyReady = useAgentStore(selectAnyReady);
  const sendPrompt = useMessageStore((s) => s.sendPrompt);
  const cancelPrompt = useMessageStore((s) => s.cancelPrompt);
  const updateLastUsedAt = useAgentStore((s) => s.updateLastUsedAt);
  const updateLastActiveAt = useSessionStore((s) => s.updateLastActiveAt);

  const activeSession = activeSessionId
    ? sessions.find((s) => s.sessionId === activeSessionId)
    : undefined;

  const cachedCommands = useAgentStore((s) => s.cachedCommands);
  const availableCommands = activeSession?.availableCommands ?? cachedCommands;

  // 切换 session 时加载累计 token 消耗
  useEffect(() => {
    if (activeSessionId) {
      useTokenUsageStore.getState().loadSessionUsage(activeSessionId);
    }
  }, [activeSessionId]);

  const updateSessionTitle = useSessionStore((s) => s.updateSessionTitle);

  // 发送消息（统一入口）
  const handleSend = useCallback(async () => {
    const currentPromptState = activeSessionId
      ? useMessageStore.getState().getPromptState(activeSessionId)
      : null;
    if (!input.trim() || !activeSessionId || currentPromptState?.isPrompting)
      return;
    const text = input.trim();
    const currentMsgs = useMessageStore.getState().getMessages(activeSessionId);
    const isFirstMessage = currentMsgs.length === 0;
    setInput("");
    // 首次发送时将 session 持久化
    await persistCurrentSession();
    // 更新 Agent 连接的最近使用时间
    updateLastUsedAt();
    // 更新 Session 的最近活跃时间
    updateLastActiveAt(activeSessionId);
    await sendPrompt(activeSessionId, text);

    // 记录 Token 消耗
    const latestPromptState = useMessageStore
      .getState()
      .getPromptState(activeSessionId);
    if (latestPromptState.usage) {
      const sessionMeta = useSessionStore
        .getState()
        .sessionMetas.find((m) => m.sessionId === activeSessionId);
      useTokenUsageStore
        .getState()
        .recordUsage(activeSessionId, latestPromptState.usage, {
          agentName: sessionMeta?.agentName,
          modelId: sessionMeta?.modelId,
          modelName: sessionMeta?.modelName,
        });

      // 记录当前 Agent 最近使用的模型
      if (sessionMeta?.agentName && sessionMeta?.modelId) {
        useSettingsStore
          .getState()
          .setLastModel(sessionMeta.agentName, sessionMeta.modelId);
      }
    }

    // 首条消息发送完成后，如果 Agent 没有推送 session title，则用消息内容生成 fallback
    if (isFirstMessage) {
      const meta = useSessionStore
        .getState()
        .sessionMetas.find((m) => m.sessionId === activeSessionId);
      if (meta && !meta.title) {
        const fallbackTitle =
          text.length > 30 ? text.slice(0, 30) + "..." : text;
        updateSessionTitle(activeSessionId, fallbackTitle);
      }
    }
  }, [
    input,
    activeSessionId,
    sendPrompt,
    persistCurrentSession,
    updateLastUsedAt,
    updateLastActiveAt,
    updateSessionTitle,
  ]);

  const handleCancel = useCallback(() => {
    if (activeSessionId) cancelPrompt(activeSessionId);
  }, [activeSessionId, cancelPrompt]);

  return {
    input,
    setInput,
    textareaRef,
    activeSessionId,
    activeSession,
    agentStatus,
    anyReady,
    availableCommands,
    createSession,
    handleSend,
    handleCancel,
  };
}
