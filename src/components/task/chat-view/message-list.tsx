"use client";

import { useEffect, useRef, memo } from "react";
import { useMessageStore } from "@/stores/message-store";
import { MessageBubble } from "../message-bubble";
import { UsageBadge } from "./usage-badge";

interface MessageListProps {
  sessionId: string;
}

/**
 * 消息列表组件 — 直接订阅 message store，隔离高频流式更新的渲染范围。
 * 只有当前 session 的消息/promptState 变化时才重渲染，不会波及 ChatInput 等兄弟组件。
 */
export const MessageList = memo(function MessageList({
  sessionId,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMessageStore(
    (s) => s.messagesBySession[sessionId] ?? EMPTY_MSGS,
  );
  const promptState = useMessageStore(
    (s) =>
      s.promptStates[sessionId] ?? DEFAULT_PROMPT_STATE,
  );

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
          <MemoMessageBubble key={msg.id} message={msg} />
        ))}
        <UsageBadge
          sessionId={sessionId}
          latestUsage={promptState.usage}
          stopReason={promptState.stopReason}
          isPrompting={promptState.isPrompting}
        />
      </div>
    </div>
  );
});

const MemoMessageBubble = memo(MessageBubble);

const EMPTY_MSGS: ReturnType<typeof useMessageStore.getState>["messagesBySession"][string] = [];
const DEFAULT_PROMPT_STATE = { isPrompting: false as const, stopReason: null };
