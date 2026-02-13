export type NavPage =
  | "task"
  | "agent"
  | "mcp"
  | "extension"
  | "knowledge"
  | "stats"
  | "settings"
  | "playground";

export type TaskListGroupMode = "time" | "agent" | "workspace";

export type PlaygroundPanel =
  | "agent"
  | "session"
  | "chat"
  | "batch"
  | "mcp"
  | "skills"
  | "tools"
  | "config"
  | "storage"
  | "commands"
  | "log";

export type BootPhase = "loading" | "connecting" | "done" | "no-agent";
