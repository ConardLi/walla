/**
 * 多 Agent 连接注册表
 *
 * 管理多个 ACPConnectionManager 实例，按 connectionId 索引。
 * 同时维护 sessionId → connectionId 的映射，方便 session 相关调用路由。
 */

import { ACPConnectionManager } from "./connection-manager";
import { ACPEventEmitter } from "./event-emitter";
import type { AgentProcessConfig, AgentStatusInfo } from "./types";

export class ACPManagerRegistry {
  private managers = new Map<string, ACPConnectionManager>();
  private sessionToConnection = new Map<string, string>();

  /** 聚合事件总线，转发所有 manager 的事件（附带 connectionId） */
  readonly events = new ACPEventEmitter();

  // ============ Manager 生命周期 ============

  /**
   * 为指定 connectionId 创建并连接一个 manager
   */
  async connect(
    connectionId: string,
    config: AgentProcessConfig,
  ): Promise<AgentStatusInfo> {
    // 如果已有同 ID 的 manager 且未断开，先断开
    const existing = this.managers.get(connectionId);
    if (existing) {
      await existing.disconnect();
    }

    const manager = new ACPConnectionManager();
    this.managers.set(connectionId, manager);

    // 转发事件，附带 connectionId
    manager.events.on("session:update", (notification) => {
      this.events.emit("session:update", notification);
    });
    manager.events.on("agent:status-change", (info) => {
      this.events.emit("agent:status-change", {
        ...info,
        connectionId,
      } as AgentStatusInfo & { connectionId: string });
    });
    manager.events.on("permission:request", (data) => {
      this.events.emit("permission:request", data);
    });
    manager.events.on("operation:confirm", (data) => {
      this.events.emit("operation:confirm", data);
    });

    return manager.connect(config);
  }

  /**
   * 初始化指定连接
   */
  async initialize(connectionId: string) {
    const manager = this.getManager(connectionId);
    return manager.initialize();
  }

  /**
   * 断开指定连接
   */
  async disconnect(connectionId: string): Promise<void> {
    const manager = this.managers.get(connectionId);
    if (!manager) return;
    await manager.disconnect();
    this.managers.delete(connectionId);
    // 清理 session 映射
    for (const [sid, cid] of this.sessionToConnection) {
      if (cid === connectionId) {
        this.sessionToConnection.delete(sid);
      }
    }
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    const ids = [...this.managers.keys()];
    await Promise.all(ids.map((id) => this.disconnect(id)));
  }

  // ============ 查询 ============

  getManager(connectionId: string): ACPConnectionManager {
    const manager = this.managers.get(connectionId);
    if (!manager) {
      throw new Error(`No manager for connectionId: ${connectionId}`);
    }
    return manager;
  }

  getManagerBySession(sessionId: string): ACPConnectionManager {
    const connectionId = this.sessionToConnection.get(sessionId);
    if (!connectionId) {
      throw new Error(`No connection mapped for sessionId: ${sessionId}`);
    }
    return this.getManager(connectionId);
  }

  getConnectionIdBySession(sessionId: string): string | undefined {
    return this.sessionToConnection.get(sessionId);
  }

  hasManager(connectionId: string): boolean {
    return this.managers.has(connectionId);
  }

  getStatus(connectionId: string): AgentStatusInfo {
    const manager = this.managers.get(connectionId);
    if (!manager) {
      return { status: "disconnected" };
    }
    return manager.getStatus();
  }

  getAllStatuses(): Record<string, AgentStatusInfo> {
    const result: Record<string, AgentStatusInfo> = {};
    for (const [id, manager] of this.managers) {
      result[id] = manager.getStatus();
    }
    return result;
  }

  // ============ Session 映射 ============

  registerSession(sessionId: string, connectionId: string): void {
    this.sessionToConnection.set(sessionId, connectionId);
  }

  // ============ 代理方法（通过 connectionId 路由） ============

  async newSession(connectionId: string, params: Parameters<ACPConnectionManager["newSession"]>[0]) {
    const manager = this.getManager(connectionId);
    const result = await manager.newSession(params);
    this.registerSession(result.sessionId, connectionId);
    return result;
  }

  async loadSession(connectionId: string, params: Parameters<ACPConnectionManager["loadSession"]>[0]) {
    const manager = this.getManager(connectionId);
    const result = await manager.loadSession(params);
    this.registerSession(params.sessionId, connectionId);
    return result;
  }

  async listSessions(connectionId: string, params: Parameters<ACPConnectionManager["listSessions"]>[0]) {
    const manager = this.getManager(connectionId);
    return manager.listSessions(params);
  }

  getLocalSessions(connectionId: string) {
    const manager = this.managers.get(connectionId);
    return manager?.getLocalSessions() ?? [];
  }

  async prompt(sessionId: string, params: Parameters<ACPConnectionManager["prompt"]>[0]) {
    const manager = this.getManagerBySession(sessionId);
    return manager.prompt(params);
  }

  async cancel(sessionId: string, params: Parameters<ACPConnectionManager["cancel"]>[0]) {
    const manager = this.getManagerBySession(sessionId);
    return manager.cancel(params);
  }

  async setSessionMode(sessionId: string, params: Parameters<ACPConnectionManager["setSessionMode"]>[0]) {
    const manager = this.getManagerBySession(sessionId);
    return manager.setSessionMode(params);
  }

  async setSessionModel(sessionId: string, params: Parameters<ACPConnectionManager["setSessionModel"]>[0]) {
    const manager = this.getManagerBySession(sessionId);
    return manager.setSessionModel(params);
  }

  async setSessionConfigOption(sessionId: string, params: Parameters<ACPConnectionManager["setSessionConfigOption"]>[0]) {
    const manager = this.getManagerBySession(sessionId);
    return manager.setSessionConfigOption(params);
  }

  async authenticate(connectionId: string, params: Parameters<ACPConnectionManager["authenticate"]>[0]) {
    const manager = this.getManager(connectionId);
    return manager.authenticate(params);
  }
}
