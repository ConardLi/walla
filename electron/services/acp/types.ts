/**
 * ACP 服务内部类型定义
 *
 * 注意: SDK 中 AgentInfo 对应的类型是 Implementation { name, version, title? }
 */

import type * as acp from "@agentclientprotocol/sdk";

// ============ Agent 进程配置 ============

export interface AgentProcessConfig {
  /** Agent 可执行文件路径 */
  command: string;
  /** 启动参数 */
  args?: string[];
  /** 工作目录 */
  cwd?: string;
  /** 追加的环境变量 */
  env?: Record<string, string>;
}

// ============ 连接状态 ============

export type AgentStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "initializing"
  | "ready"
  | "error";

export interface AgentStatusInfo {
  status: AgentStatus;
  /** SDK 类型为 Implementation */
  agentInfo?: acp.Implementation;
  agentCapabilities?: acp.AgentCapabilities;
  error?: string;
}

// ============ 初始化配置 ============

export interface InitializeConfig {
  clientCapabilities?: acp.ClientCapabilities;
}

export const DEFAULT_CLIENT_CAPABILITIES: acp.ClientCapabilities = {
  fs: {
    readTextFile: true,
    writeTextFile: true,
  },
  terminal: true,
};

// ============ 事件类型 ============

export interface ACPEventMap {
  /** Agent 状态变更 */
  "agent:status-change": AgentStatusInfo;
  /** 会话更新（流式推送） */
  "session:update": acp.SessionNotification;
  /** 权限请求（需要渲染进程响应） */
  "permission:request": PermissionRequestWithResolver;
  /** 操作确认请求（手动授权模式下，拦截敏感操作） */
  "operation:confirm": OperationConfirmRequest;
}

export interface PermissionRequestWithResolver {
  request: acp.RequestPermissionRequest;
  resolve: (response: acp.RequestPermissionResponse) => void;
}

/** 操作确认请求 */
export interface OperationConfirmRequest {
  confirmId: string;
  operation: string;
  description: string;
  detail?: Record<string, unknown>;
  resolve: (approved: boolean) => void;
}

// ============ 会话信息 ============

export interface SessionEntry {
  sessionId: string;
  cwd: string;
  createdAt: number;
}
