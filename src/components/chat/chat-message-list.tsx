"use client";

import { useEffect, useRef, memo } from "react";
import { useChatStore } from "@/stores/chat-store";
import { ChatMessageBubble } from "./chat-message-bubble";

interface ChatMessageListProps {
  conversationId: string;
}

export const ChatMessageList = memo(function ChatMessageList({
  conversationId,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((s) => {
    const conv = s.conversations.find((c) => c.id === conversationId);
    return conv?.messages ?? EMPTY;
  });

  // 自动滚动到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="max-w-3xl mx-auto px-6 py-4 space-y-1">
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
});

const EMPTY: ReturnType<typeof useChatStore.getState>["conversations"][number]["messages"] = [];
