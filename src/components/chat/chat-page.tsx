"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useModelStore } from "@/stores/model-store";
import * as ipc from "@/services/ipc-client";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { ChatModelSelector } from "./chat-model-selector";
import { ChatSettingsPopover } from "./chat-settings-popover";
import { RotatingText } from "@/components/ui/rotating-text";

export function ChatPage() {
  const [input, setInput] = useState("");

  const loaded = useChatStore((s) => s.loaded);
  const load = useChatStore((s) => s.load);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const cancelStream = useChatStore((s) => s.cancelStream);
  const newConversation = useChatStore((s) => s.newConversation);
  const selectedModelId = useChatStore((s) => s.selectedModelId);

  const modelLoaded = useModelStore((s) => s.loaded);

  const hasMessages = useChatStore((s) => {
    if (!s.activeConversationId) return false;
    const conv = s.conversations.find((c) => c.id === s.activeConversationId);
    return !!conv && conv.messages.length > 0;
  });

  // 加载 store 数据
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  // 注册流式事件监听
  useEffect(() => {
    const unsubChunk = ipc.onLLMStreamChunk((data) => {
      useChatStore.getState().appendStreamChunk(data.requestId, data.text);
    });
    const unsubReasoning = ipc.onLLMStreamReasoning((data) => {
      useChatStore.getState().appendReasoningChunk(data.requestId, data.text);
    });
    const unsubEnd = ipc.onLLMStreamEnd((data) => {
      useChatStore.getState().finishStream(data.requestId, data.usage);
    });
    const unsubError = ipc.onLLMStreamError((data) => {
      useChatStore.getState().handleStreamError(data.requestId, data.error);
    });
    return () => {
      unsubChunk();
      unsubReasoning();
      unsubEnd();
      unsubError();
    };
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  const handleCancel = useCallback(() => {
    cancelStream();
  }, [cancelStream]);

  if (!loaded || !modelLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // 未选择模型
  if (!selectedModelId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-3">
            <MessageSquare className="h-10 w-10 mx-auto opacity-30" />
            <h2 className="text-lg font-medium text-foreground">开始聊天</h2>
            <p className="text-sm text-muted-foreground">请先选择一个模型</p>
            <div className="flex justify-center">
              <ChatModelSelector />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 有 activeConversation 且有消息 → 正常对话布局
  if (activeConversationId && hasMessages) {
    return (
      <div className="flex flex-col h-full">
        <ChatMessageList conversationId={activeConversationId} />
        <div className="p-3">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onCancel={handleCancel}
            isStreaming={isStreaming}
            className="max-w-3xl mx-auto"
            compact
          />
        </div>
      </div>
    );
  }

  // 空状态 → 居中展示输入框
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-3">
            <RotatingText />
            <div className="flex justify-center items-center gap-3">
              <ChatModelSelector />
              <ChatSettingsPopover />
            </div>
          </div>
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onCancel={handleCancel}
            isStreaming={isStreaming}
            className="max-w-2xl"
          />
        </div>
      </div>
    </div>
  );
}
