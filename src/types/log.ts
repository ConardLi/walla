export type LogDirection = "send" | "receive";

export type LogCategory =
  | "agent"
  | "session"
  | "prompt"
  | "config"
  | "permission"
  | "skill"
  | "system"
  | "event";

export interface UpdateLogEntry {
  id: string;
  sessionId: string;
  timestamp: number;
  direction: LogDirection;
  category: LogCategory;
  method: string;
  raw: unknown;
}
