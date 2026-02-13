/**
 * 渲染进程侧 IPC 客户端封装
 * 提供类型安全的 API 调用，屏蔽 Electron IPC 细节
 */

import type {
  AgentConnectRequest,
  AgentStatusInfo,
  ACPInitializeResponse,
  AuthenticateRequest,
  AuthenticateResponse,
  SessionNewRequest,
  SessionInfo,
  SessionLoadRequest,
  PromptRequest,
  PromptResponse,
  CancelRequest,
  SetModeRequest,
  SetModelRequest,
  SetConfigRequest,
  PermissionResponsePayload,
  SessionUpdateEvent,
  PermissionRequestEvent,
} from "@/shared/ipc-types";
import { useUpdateLogStore } from "@/stores/update-log-store";
import type { LogCategory } from "@/types/log";

function logSend(
  category: LogCategory,
  method: string,
  params: unknown,
  sessionId = "",
) {
  useUpdateLogStore.getState().addEntry({
    sessionId,
    direction: "send",
    category,
    method,
    raw: params,
  });
}

function logResponse(
  category: LogCategory,
  method: string,
  result: unknown,
  sessionId = "",
) {
  useUpdateLogStore.getState().addEntry({
    sessionId,
    direction: "receive",
    category,
    method: `${method}:response`,
    raw: result,
  });
}

function getAPI() {
  if (typeof window === "undefined" || !window.electronAPI) {
    throw new Error("electronAPI not available - not running in Electron");
  }
  return window.electronAPI;
}

/** 检测是否在 Electron 环境中运行 */
export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

// ============ 系统 ============

export async function ping(): Promise<{
  ok: boolean;
  timestamp: number;
  source: string;
}> {
  return getAPI().ping();
}

export async function getVersion(): Promise<{ version: string }> {
  return getAPI().getVersion();
}

export async function selectDirectory(): Promise<{ path: string | null }> {
  return getAPI().selectDirectory();
}

// ============ Agent ============

export async function detectAgentCli(
  commands: string[],
): Promise<Record<string, boolean>> {
  return getAPI().detectAgentCli({ commands });
}

export async function agentConnect(
  params: AgentConnectRequest,
): Promise<AgentStatusInfo> {
  logSend("agent", "agent:connect", params);
  const result = await getAPI().agentConnect(params);
  logResponse("agent", "agent:connect", result);
  return result;
}

export async function agentDisconnect(params?: {
  connectionId?: string;
}): Promise<void> {
  logSend("agent", "agent:disconnect", params);
  return getAPI().agentDisconnect(params);
}

export async function agentStatus(): Promise<AgentStatusInfo> {
  logSend("agent", "agent:status", null);
  const result = await getAPI().agentStatus();
  logResponse("agent", "agent:status", result);
  return result;
}

// ============ ACP ============

export async function acpInitialize(params: {
  connectionId: string;
}): Promise<ACPInitializeResponse> {
  logSend("agent", "acp:initialize", params);
  const result = await getAPI().acpInitialize(params);
  logResponse("agent", "acp:initialize", result);
  return result;
}

// ============ 认证 ============

export async function authenticate(
  params: AuthenticateRequest,
): Promise<AuthenticateResponse> {
  logSend("agent", "acp:authenticate", params);
  const result = await getAPI().authenticate(params);
  logResponse("agent", "acp:authenticate", result);
  return result;
}

// ============ Shell ============

export async function shellExec(params: {
  command: string;
  args?: string[];
}): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  logSend("agent", "shell:exec", params);
  const result = await getAPI().shellExec(params);
  logResponse("agent", "shell:exec", result);
  return result;
}

export async function shellWrite(
  data: string,
): Promise<{ success: boolean; error?: string }> {
  return getAPI().shellWrite({ data });
}

export function onShellOutput(
  callback: (data: { stream: "stdout" | "stderr"; data: string }) => void,
): () => void {
  return getAPI().onShellOutput((_event: unknown, data: unknown) =>
    callback(data as { stream: "stdout" | "stderr"; data: string }),
  );
}

// ============ Session ============

export async function sessionNew(
  params: SessionNewRequest,
): Promise<SessionInfo> {
  logSend("session", "session:new", params);
  const result = await getAPI().sessionNew(params);
  logResponse("session", "session:new", result, result?.sessionId ?? "");
  return result;
}

export async function sessionLoad(
  params: SessionLoadRequest,
): Promise<SessionInfo> {
  logSend("session", "session:load", params, params.sessionId);
  const result = await getAPI().sessionLoad(params);
  logResponse("session", "session:load", result, params.sessionId);
  return result;
}

export async function sessionList(): Promise<string[]> {
  logSend("session", "session:list", null);
  const result = await getAPI().sessionList();
  logResponse("session", "session:list", result);
  return result;
}

// ============ Prompt ============

export async function sessionPrompt(
  params: PromptRequest,
): Promise<PromptResponse> {
  logSend("prompt", "session:prompt", params, params.sessionId);
  const result = await getAPI().sessionPrompt(params);
  logResponse("prompt", "session:prompt", result, params.sessionId);
  return result;
}

export async function sessionCancel(params: CancelRequest): Promise<void> {
  logSend("prompt", "session:cancel", params, params.sessionId);
  return getAPI().sessionCancel(params);
}

// ============ Config ============

export async function sessionSetMode(params: SetModeRequest): Promise<void> {
  logSend("config", "session:set-mode", params, params.sessionId);
  return getAPI().sessionSetMode(params);
}

export async function sessionSetModel(params: SetModelRequest): Promise<void> {
  logSend("config", "session:set-model", params, params.sessionId);
  return getAPI().sessionSetModel(params);
}

export async function sessionSetConfig(
  params: SetConfigRequest,
): Promise<void> {
  logSend("config", "session:set-config", params, params.sessionId);
  return getAPI().sessionSetConfig(params);
}

// ============ Permission ============

export async function permissionResponse(
  params: PermissionResponsePayload,
): Promise<void> {
  logSend("permission", "permission:response", params);
  return getAPI().permissionResponse(params);
}

// ============ 操作确认 ============

export async function operationConfirmResponse(
  params: import("@/shared/ipc-types").OperationConfirmResponsePayload,
): Promise<{ ok: boolean }> {
  logSend("permission", "operation:confirm-response", params);
  return getAPI().operationConfirmResponse(params);
}

export function onOperationConfirm(
  callback: (data: import("@/shared/ipc-types").OperationConfirmEvent) => void,
): () => void {
  return getAPI().onOperationConfirm((_event: unknown, data: unknown) => {
    callback(data as import("@/shared/ipc-types").OperationConfirmEvent);
  });
}

// ============ Skills ============

export async function skillInstall(
  params: import("@/shared/ipc-types").SkillInstallRequest,
): Promise<{ ok: boolean; path: string }> {
  logSend("skill", "skill:install", params);
  const result = await getAPI().skillInstall(params);
  logResponse("skill", "skill:install", result);
  return result;
}

export async function skillList(
  params: import("@/shared/ipc-types").SkillListRequest,
): Promise<{ skills: import("@/shared/ipc-types").SkillInfo[] }> {
  logSend("skill", "skill:list", params);
  const result = await getAPI().skillList(params);
  logResponse("skill", "skill:list", result);
  return result;
}

export async function skillRemove(
  params: import("@/shared/ipc-types").SkillRemoveRequest,
): Promise<{ ok: boolean }> {
  logSend("skill", "skill:remove", params);
  const result = await getAPI().skillRemove(params);
  logResponse("skill", "skill:remove", result);
  return result;
}

// ============ Storage ============

export async function storageGet(
  params: import("@/shared/ipc-types").StorageGetRequest,
): Promise<{ value: unknown }> {
  logSend("system", "storage:get", params);
  const result = await getAPI().storageGet(params);
  logResponse("system", "storage:get", result);
  return result;
}

export async function storageSet(
  params: import("@/shared/ipc-types").StorageSetRequest,
): Promise<{ ok: boolean }> {
  logSend("system", "storage:set", params);
  const result = await getAPI().storageSet(params);
  logResponse("system", "storage:set", result);
  return result;
}

export async function storageDelete(
  params: import("@/shared/ipc-types").StorageDeleteRequest,
): Promise<{ ok: boolean }> {
  logSend("system", "storage:delete", params);
  const result = await getAPI().storageDelete(params);
  logResponse("system", "storage:delete", result);
  return result;
}

export async function storageHas(
  params: import("@/shared/ipc-types").StorageHasRequest,
): Promise<{ exists: boolean }> {
  logSend("system", "storage:has", params);
  const result = await getAPI().storageHas(params);
  logResponse("system", "storage:has", result);
  return result;
}

export async function storageClear(
  params: import("@/shared/ipc-types").StorageClearRequest,
): Promise<{ ok: boolean }> {
  logSend("system", "storage:clear", params);
  const result = await getAPI().storageClear(params);
  logResponse("system", "storage:clear", result);
  return result;
}

export async function storageGetAll(
  params: import("@/shared/ipc-types").StorageGetAllRequest,
): Promise<{ data: Record<string, unknown> }> {
  logSend("system", "storage:get-all", params);
  const result = await getAPI().storageGetAll(params);
  logResponse("system", "storage:get-all", result);
  return result;
}

export async function storageKeys(
  params: import("@/shared/ipc-types").StorageKeysRequest,
): Promise<{ keys: string[] }> {
  logSend("system", "storage:keys", params);
  const result = await getAPI().storageKeys(params);
  logResponse("system", "storage:keys", result);
  return result;
}

export async function storageSetMany(
  params: import("@/shared/ipc-types").StorageSetManyRequest,
): Promise<{ ok: boolean }> {
  logSend("system", "storage:set-many", params);
  const result = await getAPI().storageSetMany(params);
  logResponse("system", "storage:set-many", result);
  return result;
}

export async function storageGetInfo(): Promise<
  import("@/shared/ipc-types").StorageGetInfoResponse
> {
  logSend("system", "storage:get-info", null);
  const result = await getAPI().storageGetInfo();
  logResponse("system", "storage:get-info", result);
  return result;
}

// ============ MCP ============

export async function mcpConnect(
  params: import("@/types/mcp").MCPConnectRequest,
): Promise<import("@/types/mcp").MCPConnectResponse> {
  logSend("system", "mcp:connect", params);
  const result = await getAPI().mcpConnect(params);
  logResponse("system", "mcp:connect", result);
  return result;
}

export async function mcpDisconnect(
  params: import("@/types/mcp").MCPDisconnectRequest,
): Promise<{ ok: boolean }> {
  logSend("system", "mcp:disconnect", params);
  const result = await getAPI().mcpDisconnect(params);
  logResponse("system", "mcp:disconnect", result);
  return result;
}

export async function mcpRefresh(
  params: import("@/types/mcp").MCPRefreshRequest,
): Promise<import("@/types/mcp").MCPConnectResponse> {
  logSend("system", "mcp:refresh", params);
  const result = await getAPI().mcpRefresh(params);
  logResponse("system", "mcp:refresh", result);
  return result;
}

export async function mcpDisconnectAll(): Promise<{ ok: boolean }> {
  logSend("system", "mcp:disconnect-all", null);
  const result = await getAPI().mcpDisconnectAll();
  logResponse("system", "mcp:disconnect-all", result);
  return result;
}

// ============ 事件订阅 ============

export function onSessionUpdate(
  callback: (data: SessionUpdateEvent) => void,
): () => void {
  return getAPI().onSessionUpdate((_event: unknown, data: unknown) => {
    callback(data as SessionUpdateEvent);
  });
}

export function onPermissionRequest(
  callback: (data: PermissionRequestEvent) => void,
): () => void {
  return getAPI().onPermissionRequest((_event: unknown, data: unknown) => {
    callback(data as PermissionRequestEvent);
  });
}

export function onAgentStatusChange(
  callback: (data: AgentStatusInfo) => void,
): () => void {
  return getAPI().onAgentStatusChange((_event: unknown, data: unknown) => {
    callback(data as AgentStatusInfo);
  });
}
