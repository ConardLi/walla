/**
 * ACP 核心服务 — Barrel Export
 */

export { ACPConnectionManager } from "./connection-manager";
export { ACPManagerRegistry } from "./manager-registry";
export { ACPEventEmitter } from "./event-emitter";
export { createACPClient, cleanupAllTerminals } from "./client-impl";
export { spawnAgentProcess, killAgentProcess } from "./agent-process";
export type { AgentProcessHandle } from "./agent-process";
export {
  DEFAULT_CLIENT_CAPABILITIES,
  type AgentProcessConfig,
  type AgentStatus,
  type AgentStatusInfo,
  type InitializeConfig,
  type SessionEntry,
  type ACPEventMap,
  type PermissionRequestWithResolver,
} from "./types";
