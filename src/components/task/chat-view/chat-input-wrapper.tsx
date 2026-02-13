"use client";

import { memo } from "react";
import { useMessageStore } from "@/stores/message-store";
import { ChatInput } from "../chat-input";
import type { SessionInfo } from "@/types/session";

interface ChatInputWrapperProps {
  sessionId: string;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  session?: SessionInfo;
  availableCommands?: Array<{ name: string; description: string }>;
  onModeChange?: (modeId: string) => void;
  onModelChange?: (modelId: string) => void;
  onCwdChange?: (cwd: string) => void;
  cwdReadOnly?: boolean;
  agentName?: string;
  className?: string;
  compact?: boolean;
}

/**
 * ChatInput 的包装组件，独立订阅 promptState 以获取 isPrompting。
 * 这样 isPrompting 的变化只会重渲染这个包装组件，不会波及 ChatView 的其他部分。
 */
export const ChatInputWrapper = memo(function ChatInputWrapper({
  sessionId,
  ...rest
}: ChatInputWrapperProps) {
  const isPrompting = useMessageStore(
    (s) => s.promptStates[sessionId]?.isPrompting ?? false,
  );

  return <ChatInput {...rest} isPrompting={isPrompting} />;
});
