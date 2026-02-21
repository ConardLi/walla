export type NavPage =
  | "task"
  | "agent"
  | "model"
  | "mcp"
  | "extension"
  | "knowledge"
  | "stats"
  | "settings"
  | "playground";

export type TaskListGroupMode = "time" | "agent" | "workspace";
export type TaskListSortMode = "created" | "updated";

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
