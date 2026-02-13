/**
 * IPC 频道常量定义
 * Electron 主进程与渲染进程共享
 */

export const IPC_CHANNELS = {
  // Agent 生命周期
  AGENT_CONNECT: "agent:connect",
  AGENT_DISCONNECT: "agent:disconnect",
  AGENT_STATUS: "agent:status",

  // ACP 初始化
  ACP_INITIALIZE: "acp:initialize",

  // 认证
  AUTHENTICATE: "acp:authenticate",
  SHELL_EXEC: "shell:exec",
  SHELL_WRITE: "shell:write",
  EVENT_SHELL_OUTPUT: "event:shell-output",

  // 会话管理
  SESSION_NEW: "session:new",
  SESSION_LOAD: "session:load",
  SESSION_LIST: "session:list",

  // Prompt
  SESSION_PROMPT: "session:prompt",
  SESSION_CANCEL: "session:cancel",

  // 会话配置
  SESSION_SET_MODE: "session:set-mode",
  SESSION_SET_MODEL: "session:set-model",
  SESSION_SET_CONFIG: "session:set-config",

  // 事件流（主进程 → 渲染进程）
  EVENT_SESSION_UPDATE: "event:session-update",
  EVENT_PERMISSION_REQUEST: "event:permission-request",
  EVENT_AGENT_STATUS_CHANGE: "event:agent-status-change",
  EVENT_OPERATION_CONFIRM: "event:operation-confirm",

  // 权限响应（渲染进程 → 主进程）
  PERMISSION_RESPONSE: "permission:response",
  OPERATION_CONFIRM_RESPONSE: "operation:confirm-response",

  // Skills
  SKILL_INSTALL: "skill:install",
  SKILL_LIST: "skill:list",
  SKILL_REMOVE: "skill:remove",

  // Storage
  STORAGE_GET: "storage:get",
  STORAGE_SET: "storage:set",
  STORAGE_DELETE: "storage:delete",
  STORAGE_HAS: "storage:has",
  STORAGE_CLEAR: "storage:clear",
  STORAGE_GET_ALL: "storage:get-all",
  STORAGE_KEYS: "storage:keys",
  STORAGE_SET_MANY: "storage:set-many",
  STORAGE_GET_INFO: "storage:get-info",

  // MCP Server 管理
  MCP_CONNECT: "mcp:connect",
  MCP_DISCONNECT: "mcp:disconnect",
  MCP_REFRESH: "mcp:refresh",
  MCP_DISCONNECT_ALL: "mcp:disconnect-all",

  // Agent 探测
  AGENT_DETECT_CLI: "agent:detect-cli",

  // 系统
  APP_GET_VERSION: "app:get-version",
  SELECT_DIRECTORY: "dialog:select-directory",
  PING: "ping",
} as const;

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
