export type ToolCallContent =
  | { type: "diff"; path: string; newText: string }
  | { type: "content"; content: { type: string; text?: string } }
  | { type: "terminal"; terminalId: string };

export interface ToolCall {
  toolCallId: string;
  sessionId: string;
  title: string;
  kind?: string;
  status: string;
  content: ToolCallContent[];
  timestamp: number;
}
