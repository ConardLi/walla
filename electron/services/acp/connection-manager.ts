/**
 * ACP 连接管理器
 *
 * 高层 API 编排，对外唯一入口。
 * 负责：
 *   - Agent 进程生命周期（启动、销毁）
 *   - ACP 连接建立与初始化
 *   - 会话管理（创建、加载、列表）
 *   - Prompt 发送与取消
 *   - 模式/配置切换
 *   - 状态追踪与事件转发
 */

import * as acp from "@agentclientprotocol/sdk";
import { ACPEventEmitter } from "./event-emitter";
import {
  spawnAgentProcess,
  killAgentProcess,
  type AgentProcessHandle,
} from "./agent-process";
import { createACPClient, cleanupAllTerminals } from "./client-impl";
import {
  type AgentProcessConfig,
  type AgentStatus,
  type AgentStatusInfo,
  type InitializeConfig,
  type SessionEntry,
  DEFAULT_CLIENT_CAPABILITIES,
} from "./types";

export class ACPConnectionManager {
  private processHandle: AgentProcessHandle | null = null;
  private connection: acp.ClientSideConnection | null = null;
  private initResult: acp.InitializeResponse | null = null;
  private status: AgentStatus = "disconnected";
  private sessions = new Map<string, SessionEntry>();

  readonly events = new ACPEventEmitter();

  // ============ 状态查询 ============

  getStatus(): AgentStatusInfo {
    return {
      status: this.status,
      agentInfo: this.initResult?.agentInfo ?? undefined,
      agentCapabilities: this.initResult?.agentCapabilities ?? undefined,
    };
  }

  isConnected(): boolean {
    return this.status === "ready";
  }

  getConnection(): acp.ClientSideConnection | null {
    return this.connection;
  }

  // ============ 连接生命周期 ============

  /**
   * 启动 Agent 进程并建立 ACP 连接
   */
  async connect(config: AgentProcessConfig): Promise<AgentStatusInfo> {
    // 如果已连接，先自动断开
    if (this.status !== "disconnected" && this.status !== "error") {
      console.log(
        `[ACPConnectionManager] Auto-disconnecting before reconnect (was "${this.status}")`,
      );
      this.handleDisconnect();
    }

    try {
      this.setStatus("connecting");

      // 1. 启动 Agent 进程
      this.processHandle = await spawnAgentProcess(config);

      // 2. 建立 ACP 连接
      this.setStatus("connected");
      const client = createACPClient(this.events);
      const stream = acp.ndJsonStream(
        this.processHandle.inputStream,
        this.processHandle.outputStream,
      );
      this.connection = new acp.ClientSideConnection(() => client, stream);

      // 3. 监听连接关闭
      this.connection.closed.then(() => {
        console.log("[ACPConnectionManager] Connection closed");
        this.handleDisconnect();
      });

      return this.getStatus();
    } catch (err) {
      this.setStatus("error", (err as Error).message);
      throw err;
    }
  }

  /**
   * 发送 ACP initialize 请求
   */
  async initialize(config?: InitializeConfig): Promise<acp.InitializeResponse> {
    this.ensureConnected();
    try {
      this.setStatus("initializing");

      this.initResult = await this.connection!.initialize({
        protocolVersion: acp.PROTOCOL_VERSION,
        clientCapabilities:
          config?.clientCapabilities ?? DEFAULT_CLIENT_CAPABILITIES,
      });

      this.setStatus("ready");
      console.log(
        `[ACPConnectionManager] Initialized: ${this.initResult.agentInfo?.name} v${this.initResult.agentInfo?.version}`,
      );

      return this.initResult;
    } catch (err) {
      this.setStatus("error", (err as Error).message);
      throw err;
    }
  }

  /**
   * 断开连接并销毁 Agent 进程
   */
  async disconnect(): Promise<void> {
    this.handleDisconnect();
  }

  // ============ 会话管理 ============

  async newSession(
    params: acp.NewSessionRequest,
  ): Promise<acp.NewSessionResponse> {
    this.ensureReady();
    const result = await this.connection!.newSession(params);

    this.sessions.set(result.sessionId, {
      sessionId: result.sessionId,
      cwd: params.cwd,
      createdAt: Date.now(),
    });

    console.log(`[ACPConnectionManager] New session: ${result.sessionId}`);
    return result;
  }

  async loadSession(
    params: acp.LoadSessionRequest,
  ): Promise<acp.LoadSessionResponse> {
    this.ensureReady();
    const caps = this.initResult?.agentCapabilities;
    if (!caps?.loadSession) {
      throw new Error("Agent does not support loadSession");
    }
    const result = await this.connection!.loadSession(params);
    console.log(`[ACPConnectionManager] Loaded session: ${params.sessionId}`);
    return result;
  }

  async listSessions(
    params: acp.ListSessionsRequest,
  ): Promise<acp.ListSessionsResponse> {
    this.ensureReady();
    return this.connection!.unstable_listSessions(params);
  }

  getLocalSessions(): SessionEntry[] {
    return Array.from(this.sessions.values());
  }

  // ============ Prompt ============

  async prompt(params: acp.PromptRequest): Promise<acp.PromptResponse> {
    this.ensureReady();
    return this.connection!.prompt(params);
  }

  async cancel(params: acp.CancelNotification): Promise<void> {
    this.ensureReady();
    return this.connection!.cancel(params);
  }

  // ============ 配置 ============

  async setSessionMode(
    params: acp.SetSessionModeRequest,
  ): Promise<acp.SetSessionModeResponse> {
    this.ensureReady();
    return this.connection!.setSessionMode(params);
  }

  async setSessionModel(
    params: acp.SetSessionModelRequest,
  ): Promise<acp.SetSessionModelResponse> {
    this.ensureReady();
    return this.connection!.unstable_setSessionModel(params);
  }

  async setSessionConfigOption(
    params: acp.SetSessionConfigOptionRequest,
  ): Promise<acp.SetSessionConfigOptionResponse> {
    this.ensureReady();
    return this.connection!.setSessionConfigOption(params);
  }

  // ============ 认证 ============

  async authenticate(
    params: acp.AuthenticateRequest,
  ): Promise<acp.AuthenticateResponse> {
    this.ensureConnected();
    return this.connection!.authenticate(params);
  }

  // ============ 内部方法 ============

  private ensureConnected(): void {
    if (!this.connection) {
      throw new Error("Not connected to Agent");
    }
  }

  private ensureReady(): void {
    if (this.status !== "ready") {
      throw new Error(
        `Agent not ready (status: "${this.status}"). Call connect() and initialize() first.`,
      );
    }
  }

  private setStatus(status: AgentStatus, error?: string): void {
    this.status = status;
    const info = this.getStatus();
    if (error) info.error = error;
    this.events.emit("agent:status-change", info);
  }

  private handleDisconnect(): void {
    // 清理终端
    cleanupAllTerminals();

    // 销毁进程
    if (this.processHandle) {
      killAgentProcess(this.processHandle);
      this.processHandle = null;
    }

    this.connection = null;
    this.initResult = null;
    this.sessions.clear();
    this.setStatus("disconnected");
  }
}
