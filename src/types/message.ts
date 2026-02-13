export type MessageRole = "user" | "agent" | "thought" | "tool" | "error";

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  // tool call 专用字段
  toolCallId?: string;
  toolTitle?: string;
  toolKind?: string;
  toolStatus?: string;
  toolInput?: Record<string, unknown>;
  toolContent?: Array<{
    type: string;
    path?: string;
    newText?: string;
    terminalId?: string;
    content?: { type: string; text?: string };
  }>;
}

export interface PromptState {
  isPrompting: boolean;
  stopReason: string | null;
  usage?: {
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    thoughtTokens?: number;
    cachedReadTokens?: number;
  };
}
