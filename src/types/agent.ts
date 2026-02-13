import type { AgentInfo, AgentCapabilities } from "@/shared/ipc-types";

export type AgentStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "initializing"
  | "ready"
  | "error";

export interface AuthMethodTerminalMeta {
  command: string;
  args?: string[];
  label?: string;
}

export interface AuthMethod {
  id: string;
  name: string;
  description?: string;
  _meta?: {
    "terminal-auth"?: AuthMethodTerminalMeta;
  };
}

export interface AgentInitMeta {
  protocolVersion: number;
  agentInfo: AgentInfo | null;
  agentCapabilities: AgentCapabilities | null;
  authMethods: AuthMethod[];
  connectedAt: number;
}

export interface AgentConnection {
  id: string;
  name: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  approvalMode: "default" | "auto" | "manual";
  createdAt: number;
  lastUsedAt: number;
  isDefault?: boolean;
  initMeta?: AgentInitMeta;
}

/** 每个连接的运行时状态 */
export interface AgentRuntimeState {
  status: AgentStatus;
  protocolVersion: number | null;
  agentInfo: AgentInfo | null;
  agentCapabilities: AgentCapabilities | null;
  authMethods: AuthMethod[];
  error: string | null;
}
