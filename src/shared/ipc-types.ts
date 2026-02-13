/**
 * IPC 请求/响应类型定义
 * Electron 主进程与渲染进程共享
 */

// ============ Agent 连接 ============

export interface AgentConnectRequest {
  /** Agent 连接配置 ID */
  connectionId: string;
  /** Agent 可执行文件路径 */
  command: string;
  /** 启动参数 */
  args?: string[];
  /** 工作目录 */
  cwd?: string;
  /** 追加的环境变量 */
  env?: Record<string, string>;
}

export interface AgentInfo {
  name: string;
  version: string;
  title?: string;
}

export interface PromptCapabilities {
  embeddedContext?: boolean;
  image?: boolean;
}

export interface McpCapabilities {
  http?: boolean;
  sse?: boolean;
}

export interface SessionCapabilities {
  fork?: Record<string, unknown>;
  list?: Record<string, unknown>;
  resume?: Record<string, unknown>;
}

export interface AgentCapabilities {
  loadSession?: boolean;
  promptCapabilities?: PromptCapabilities;
  mcpCapabilities?: McpCapabilities;
  sessionCapabilities?: SessionCapabilities;
}

export type AgentStatus = "disconnected" | "connecting" | "connected" | "error";

export interface AgentStatusInfo {
  status: AgentStatus;
  connectionId?: string;
  agentInfo?: AgentInfo;
  agentCapabilities?: AgentCapabilities;
  error?: string;
}

// ============ ACP 初始化 ============

export interface ACPInitializeResponse {
  protocolVersion: number;
  agentInfo?: AgentInfo;
  agentCapabilities?: AgentCapabilities;
  authMethods?: Array<{
    id: string;
    name: string;
    description?: string;
    _meta?: {
      "terminal-auth"?: {
        command: string;
        args?: string[];
        label?: string;
      };
    };
  }>;
}

// ============ 认证 ============

export interface AuthenticateRequest {
  connectionId: string;
  methodId: string;
}

export interface AuthenticateResponse {
  success: boolean;
}

// ============ MCP Server ============

export interface McpServerStdio {
  name: string;
  command: string;
  args?: string[];
  env?: Array<{ name: string; value: string }>;
}

export interface McpServerHttp {
  type: "http";
  name: string;
  url: string;
  headers?: Array<{ name: string; value: string }>;
}

export interface McpServerSse {
  type: "sse";
  name: string;
  url: string;
  headers?: Array<{ name: string; value: string }>;
}

export type McpServerConfig = McpServerStdio | McpServerHttp | McpServerSse;

// ============ 会话 ============

export interface SessionNewRequest {
  connectionId: string;
  cwd: string;
  mcpServers?: McpServerConfig[];
}

export interface SessionInfo {
  sessionId: string;
  modes?: {
    availableModes: Array<{ id: string; name: string; description?: string }>;
    currentModeId?: string;
  };
  models?: {
    availableModels: Array<{
      modelId: string;
      name: string;
      description?: string | null;
    }>;
    currentModelId?: string;
  };
  configOptions?: SessionConfigOption[];
}

export interface SessionConfigOption {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  currentValue?: string;
  options?: unknown[];
}

export interface SessionLoadRequest {
  connectionId: string;
  sessionId: string;
  cwd: string;
  mcpServers?: McpServerConfig[];
}

// ============ Prompt ============

export interface PromptRequest {
  sessionId: string;
  prompt: PromptContentBlock[];
}

export type PromptContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | { type: "resource_link"; uri: string; name?: string; mimeType?: string };

export interface PromptUsage {
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  thoughtTokens?: number;
  cachedReadTokens?: number;
}

export interface PromptResponse {
  stopReason: string;
  usage?: PromptUsage;
}

// ============ 取消 ============

export interface CancelRequest {
  sessionId: string;
}

// ============ 配置 ============

export interface SetModeRequest {
  sessionId: string;
  modeId: string;
}

export interface SetConfigRequest {
  sessionId: string;
  configId: string;
  value: string;
}

export interface SetModelRequest {
  sessionId: string;
  modelId: string;
}

// ============ 事件（主进程 → 渲染进程）============

export interface SessionUpdateEvent {
  sessionId: string;
  update: SessionUpdate;
}

export type SessionUpdate =
  | AgentMessageChunk
  | AgentThoughtChunk
  | UserMessageChunk
  | ToolCallUpdate
  | ToolCallStatusUpdate
  | PlanUpdate
  | AvailableCommandsUpdate
  | CurrentModeUpdate
  | ConfigOptionUpdate
  | SessionInfoUpdateEvent;

export interface AgentMessageChunk {
  sessionUpdate: "agent_message_chunk";
  content: { type: string; text?: string };
}

export interface AgentThoughtChunk {
  sessionUpdate: "agent_thought_chunk";
  content: { type: string; text?: string };
}

export interface UserMessageChunk {
  sessionUpdate: "user_message_chunk";
  content: { type: string; text?: string };
}

export interface ToolCallUpdate {
  sessionUpdate: "tool_call";
  toolCallId: string;
  title: string;
  kind?: string;
  status: string;
}

export interface ToolCallStatusUpdate {
  sessionUpdate: "tool_call_update";
  toolCallId: string;
  status?: string;
  content?: ToolCallContent[];
}

export type ToolCallContent =
  | { type: "diff"; path: string; newText: string }
  | { type: "content"; content: { type: string; text?: string } }
  | { type: "terminal"; terminalId: string };

export interface PlanUpdate {
  sessionUpdate: "plan";
  entries: Array<{ content: string; status: string; priority?: string }>;
}

export interface AvailableCommandsUpdate {
  sessionUpdate: "available_commands_update";
  availableCommands: Array<{
    name: string;
    description: string;
    input?: { hint: string };
  }>;
}

export interface CurrentModeUpdate {
  sessionUpdate: "current_mode_update";
  currentModeId: string;
}

export interface ConfigOptionUpdate {
  sessionUpdate: "config_option_update";
  configOptions: SessionConfigOption[];
}

export interface SessionInfoUpdateEvent {
  sessionUpdate: "session_info_update";
  title?: string | null;
  updatedAt?: string | null;
}

// ============ 权限请求 ============

export interface PermissionRequestEvent {
  requestId: string;
  sessionId: string;
  toolCall: {
    title: string;
    kind?: string;
    rawInput?: unknown;
    [key: string]: unknown;
  };
  options: Array<{
    optionId: string;
    name: string;
    kind: string;
  }>;
}

export interface PermissionResponsePayload {
  requestId: string;
  outcome: { outcome: "selected"; optionId: string } | { outcome: "cancelled" };
}

// ============ 操作确认（手动授权模式）============

export interface OperationConfirmEvent {
  confirmId: string;
  operation: string;
  description: string;
  detail?: Record<string, unknown>;
}

export interface OperationConfirmResponsePayload {
  confirmId: string;
  approved: boolean;
}

// ============ Skills ============

export interface SkillInstallRequest {
  /** 目标目录，skill 将安装到 <targetDir>/.skills/<skillName>/ */
  targetDir: string;
  /** Skill 名称 (小写字母+连字符) */
  skillName: string;
  /** SKILL.md 完整内容 */
  skillContent: string;
}

export interface SkillInfo {
  name: string;
  description: string;
  path: string;
}

export interface SkillListRequest {
  /** 扫描目录 */
  targetDir: string;
}

export interface SkillRemoveRequest {
  /** 目标目录 */
  targetDir: string;
  /** Skill 名称 */
  skillName: string;
}

// ============ Storage ============

export interface StorageGetRequest {
  namespace: string;
  key: string;
}

export interface StorageSetRequest {
  namespace: string;
  key: string;
  value: unknown;
}

export interface StorageDeleteRequest {
  namespace: string;
  key: string;
}

export interface StorageHasRequest {
  namespace: string;
  key: string;
}

export interface StorageClearRequest {
  namespace: string;
}

export interface StorageGetAllRequest {
  namespace: string;
}

export interface StorageKeysRequest {
  namespace: string;
}

export interface StorageSetManyRequest {
  namespace: string;
  data: Record<string, unknown>;
}

export interface StorageInfo {
  namespace: string;
  path: string;
  size: number;
}

export interface StorageGetInfoResponse {
  namespaces: StorageInfo[];
}
