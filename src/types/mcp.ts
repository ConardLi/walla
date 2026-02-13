/** MCP Server 连接类型 */
export type MCPTransportType = "stdio" | "sse";

/** MCP Server 配置（持久化存储） */
export interface MCPServerConfig {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 连接类型 */
  transportType: MCPTransportType;
  /** Stdio 配置 */
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  /** SSE 配置 */
  url?: string;
  /** 创建时间 */
  createdAt: number;
  /** 最后连接时间 */
  lastConnectedAt?: number;
}

/** MCP Tool 信息 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/** MCP Prompt 信息 */
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/** MCP Resource 信息 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** MCP Server 运行时状态 */
export type MCPServerStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/** MCP Server 运行时信息（不持久化） */
export interface MCPServerRuntime {
  status: MCPServerStatus;
  error?: string;
  tools: MCPTool[];
  prompts: MCPPrompt[];
  resources: MCPResource[];
  serverInfo?: {
    name: string;
    version: string;
  };
}

/** IPC 请求/响应类型 */
export interface MCPConnectRequest {
  config: MCPServerConfig;
}

export interface MCPConnectResponse {
  success: boolean;
  error?: string;
  tools: MCPTool[];
  prompts: MCPPrompt[];
  resources: MCPResource[];
  serverInfo?: { name: string; version: string };
}

export interface MCPDisconnectRequest {
  serverId: string;
}

export interface MCPRefreshRequest {
  serverId: string;
}
