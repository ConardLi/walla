/**
 * Agent 连接状态 Store
 *
 * 管理 Agent 连接配置（持久化）+ 多连接运行时状态
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type { AgentInfo, AgentCapabilities } from "@/shared/ipc-types";
import { cleanErrorMessage } from "@/lib/error-utils";
import {
  isAuthRequiredError,
  performAuth,
  getPredefinedAuthMethods,
} from "@/lib/auth-utils";
import type {
  AgentStatus,
  AgentInitMeta,
  AgentConnection,
  AgentRuntimeState,
} from "@/types/agent";

export type { AgentInfo, AgentCapabilities };

const DEFAULT_RUNTIME: AgentRuntimeState = {
  status: "disconnected",
  protocolVersion: null,
  agentInfo: null,
  agentCapabilities: null,
  authMethods: [],
  error: null,
};

interface AgentState {
  // 连接配置（持久化）
  connections: AgentConnection[];
  activeConnectionId: string | null;
  connectionsLoaded: boolean;

  // 多连接运行时状态
  runtimeStates: Record<string, AgentRuntimeState>;

  // 缓存的 availableCommands（按 Agent 连接 ID 持久化）
  cachedCommands: Array<{ name: string; description: string }>;
  loadCachedCommands: (connectionId: string) => Promise<void>;
  setCachedCommands: (
    commands: Array<{ name: string; description: string }>,
  ) => Promise<void>;

  // 便捷 getter：当前活跃连接的运行时状态
  getActiveRuntime: () => AgentRuntimeState;
  getRuntime: (connectionId: string) => AgentRuntimeState;

  // 连接配置管理
  loadConnections: () => Promise<void>;
  addConnection: (
    conn: Omit<AgentConnection, "id" | "createdAt" | "lastUsedAt">,
  ) => Promise<string>;
  updateConnection: (
    id: string,
    data: Partial<Omit<AgentConnection, "id" | "createdAt" | "lastUsedAt">>,
  ) => Promise<void>;
  removeConnection: (id: string) => Promise<void>;
  setDefaultConnection: (id: string) => Promise<void>;

  // 连接操作
  connectAgent: (connectionId: string) => Promise<void>;
  disconnectAgent: (connectionId: string) => Promise<void>;
  disconnectAll: () => Promise<void>;
  autoConnect: () => Promise<boolean>;
  updateLastUsedAt: () => Promise<void>;
  reconnectAfterEdit: (
    id: string,
    data: Partial<Omit<AgentConnection, "id" | "createdAt" | "lastUsedAt">>,
  ) => Promise<void>;
  setActiveConnection: (connectionId: string) => void;

  setStatus: (info: {
    connectionId?: string;
    status: AgentStatus;
    agentInfo?: AgentInfo;
    agentCapabilities?: AgentCapabilities;
    error?: string;
  }) => void;
}

function genId() {
  return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function persistConnections(connections: AgentConnection[]) {
  await ipc.storageSet({
    namespace: "agents",
    key: "connections",
    value: connections,
  });
}

function updateRuntime(
  states: Record<string, AgentRuntimeState>,
  connectionId: string,
  patch: Partial<AgentRuntimeState>,
): Record<string, AgentRuntimeState> {
  const prev = states[connectionId] ?? { ...DEFAULT_RUNTIME };
  return { ...states, [connectionId]: { ...prev, ...patch } };
}

export const useAgentStore = create<AgentState>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  connectionsLoaded: false,
  runtimeStates: {},
  cachedCommands: [],

  getActiveRuntime: () => {
    const id = get().activeConnectionId;
    if (!id) return { ...DEFAULT_RUNTIME };
    return get().runtimeStates[id] ?? { ...DEFAULT_RUNTIME };
  },

  getRuntime: (connectionId) => {
    return get().runtimeStates[connectionId] ?? { ...DEFAULT_RUNTIME };
  },

  loadCachedCommands: async (connectionId) => {
    try {
      const result = await ipc.storageGet({
        namespace: "agents",
        key: `commands:${connectionId}`,
      });
      const cmds =
        (result.value as Array<{ name: string; description: string }>) ?? [];
      set({ cachedCommands: cmds });
    } catch {
      set({ cachedCommands: [] });
    }
  },

  setCachedCommands: async (commands) => {
    set({ cachedCommands: commands });
    const connId = get().activeConnectionId;
    if (connId) {
      await ipc.storageSet({
        namespace: "agents",
        key: `commands:${connId}`,
        value: commands,
      });
    }
  },

  // ---------- 连接配置管理 ----------

  loadConnections: async () => {
    try {
      const result = await ipc.storageGet({
        namespace: "agents",
        key: "connections",
      });
      const connections = (result.value as AgentConnection[] | null) ?? [];
      set({ connections, connectionsLoaded: true });
    } catch {
      set({ connectionsLoaded: true });
    }
  },

  addConnection: async (data) => {
    const conn: AgentConnection = {
      ...data,
      id: genId(),
      args: data.args ?? [],
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
    const connections = [...get().connections, conn];
    set({ connections });
    await persistConnections(connections);
    return conn.id;
  },

  updateConnection: async (id, data) => {
    const connections = get().connections.map((c) =>
      c.id === id ? { ...c, ...data } : c,
    );
    set({ connections });
    await persistConnections(connections);
    // 如果修改了活跃连接的 approvalMode，同步到 settings 供主进程读取
    if (data.approvalMode && id === get().activeConnectionId) {
      await ipc.storageSet({
        namespace: "settings",
        key: "approvalMode",
        value: data.approvalMode,
      });
    }
  },

  removeConnection: async (id) => {
    const connections = get().connections.filter((c) => c.id !== id);
    set({ connections });
    await persistConnections(connections);
  },

  setDefaultConnection: async (id) => {
    // toggle：允许多个连接同时标记为默认
    const connections = get().connections.map((c) => ({
      ...c,
      isDefault: c.id === id ? !c.isDefault : c.isDefault,
    }));
    set({ connections });
    await persistConnections(connections);
  },

  // ---------- 连接操作 ----------

  connectAgent: async (connectionId) => {
    const conn = get().connections.find((c) => c.id === connectionId);
    if (!conn) return;

    // 如果还没有 activeConnectionId，设为第一个连接的
    if (!get().activeConnectionId) {
      set({ activeConnectionId: connectionId });
      await get().loadCachedCommands(connectionId);
    }

    // 持久化 approvalMode（当前活跃连接的）
    if (connectionId === get().activeConnectionId) {
      await ipc.storageSet({
        namespace: "settings",
        key: "approvalMode",
        value: conn.approvalMode,
      });
    }

    // 更新运行时状态：connecting
    set((state) => ({
      runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
        status: "connecting",
        error: null,
      }),
    }));

    try {
      await ipc.agentConnect({
        connectionId,
        command: conn.command,
        args: conn.args,
        cwd: conn.cwd,
        env: conn.env,
      });

      set((state) => ({
        runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
          status: "connected",
        }),
      }));

      // 初始化
      set((state) => ({
        runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
          status: "initializing",
        }),
      }));

      const result = await ipc.acpInitialize({ connectionId });

      // 验证 initialize 结果：agentInfo 缺失说明 Agent 未正常初始化
      if (!result.agentInfo?.name) {
        // 主动断开异常连接
        try {
          await ipc.agentDisconnect({ connectionId });
        } catch {
          // ignore
        }
        throw new Error("Agent 初始化失败：未返回有效的 agentInfo");
      }

      // 再次检查连接是否已被关闭（race condition）
      const currentRt = get().runtimeStates[connectionId];
      if (
        currentRt?.status === "disconnected" ||
        currentRt?.status === "error"
      ) {
        throw new Error("Agent 连接在初始化过程中已断开");
      }

      // 验证 Session 创建：确保 Agent 可以正常工作
      const cwd = conn.cwd || "/tmp";

      // 如果 Agent 未返回 authMethods，从常量中读取预定义的 authMethods 作为回退
      const effectiveAuthMethods =
        result.authMethods && result.authMethods.length > 0
          ? result.authMethods
          : getPredefinedAuthMethods(conn.command, conn.name);

      const initMeta: AgentInitMeta = {
        protocolVersion: result.protocolVersion,
        agentInfo: result.agentInfo ?? null,
        agentCapabilities: result.agentCapabilities ?? null,
        authMethods: effectiveAuthMethods,
        connectedAt: Date.now(),
      };

      try {
        await ipc.sessionNew({ connectionId, cwd });
      } catch (sessionErr) {
        const sessionErrMsg = cleanErrorMessage((sessionErr as Error).message);

        if (
          isAuthRequiredError(sessionErrMsg) &&
          effectiveAuthMethods.length > 0
        ) {
          // 先设为 error 状态（显示失败）
          set((state) => ({
            runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
              status: "error",
              error: `需要认证：${sessionErrMsg}`,
            }),
          }));

          // 触发认证流程
          const authenticated = await performAuth(
            connectionId,
            conn.name,
            effectiveAuthMethods,
          );

          if (!authenticated) {
            // 用户取消认证，主动断开
            try {
              await ipc.agentDisconnect({ connectionId });
            } catch {
              // ignore
            }
            throw new Error("用户取消了认证");
          }

          // 认证成功，重试 Session 创建
          try {
            await ipc.sessionNew({ connectionId, cwd });
          } catch (retryErr) {
            try {
              await ipc.agentDisconnect({ connectionId });
            } catch {
              // ignore
            }
            const retryErrMsg = cleanErrorMessage((retryErr as Error).message);
            throw new Error(`认证成功但创建会话仍然失败：${retryErrMsg}`);
          }
        } else {
          // 非认证错误，主动断开
          try {
            await ipc.agentDisconnect({ connectionId });
          } catch {
            // ignore
          }
          throw new Error(`Agent 已连接但创建会话失败：${sessionErrMsg}`);
        }
      }

      set((state) => ({
        runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
          status: "ready",
          protocolVersion: result.protocolVersion,
          agentInfo: result.agentInfo ?? null,
          agentCapabilities: result.agentCapabilities ?? null,
          authMethods: effectiveAuthMethods,
        }),
      }));

      // 持久化 initMeta
      const connections = get().connections.map((c) =>
        c.id === connectionId ? { ...c, initMeta } : c,
      );
      set({ connections });
      await persistConnections(connections);
    } catch (err) {
      const errMsg = cleanErrorMessage((err as Error).message);
      set((state) => ({
        runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
          status: "error",
          error: errMsg,
        }),
      }));
      // re-throw 让调用方（handleSave / autoConnect）能感知失败
      throw new Error(errMsg);
    }
  },

  disconnectAgent: async (connectionId) => {
    try {
      await ipc.agentDisconnect({ connectionId });
      set((state) => {
        const { [connectionId]: _, ...rest } = state.runtimeStates;
        const newActiveId =
          state.activeConnectionId === connectionId
            ? (Object.keys(rest).find((id) => rest[id]?.status === "ready") ??
              null)
            : state.activeConnectionId;
        return { runtimeStates: rest, activeConnectionId: newActiveId };
      });
      // 清空该连接的 session
      const { useSessionStore } = await import("@/stores/session-store");
      const sessionStore = useSessionStore.getState();
      const metas = sessionStore.sessionMetas.filter(
        (m) => m.agentConnectionId === connectionId,
      );
      const sessionIds = new Set(metas.map((m) => m.sessionId));
      useSessionStore.setState((state) => ({
        sessions: state.sessions.filter((s) => !sessionIds.has(s.sessionId)),
        activeSessionId:
          state.activeSessionId && sessionIds.has(state.activeSessionId)
            ? null
            : state.activeSessionId,
      }));
    } catch (err) {
      set((state) => ({
        runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
          status: "error",
          error: (err as Error).message,
        }),
      }));
    }
  },

  disconnectAll: async () => {
    try {
      await ipc.agentDisconnect();
      const { useSessionStore } = await import("@/stores/session-store");
      useSessionStore.setState({ sessions: [], activeSessionId: null });
      set({
        runtimeStates: {},
        activeConnectionId: null,
      });
    } catch {
      // ignore
    }
  },

  autoConnect: async () => {
    const { connections } = get();
    if (connections.length === 0) return false;

    // 找出所有标记为默认的连接
    const defaults = connections.filter((c) => c.isDefault);
    // 如果没有默认连接，按 lastUsedAt 降序取第一个
    const toConnect =
      defaults.length > 0
        ? defaults
        : [
            [...connections].sort(
              (a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0),
            )[0],
          ];

    // 并行连接所有默认连接（connectAgent 失败会 throw，用 allSettled 不会中断其他）
    await Promise.allSettled(
      toConnect.map((conn) => get().connectAgent(conn.id)),
    );

    // 仅根据实际运行时状态判断是否有连接成功
    return Object.values(get().runtimeStates).some(
      (rt) => rt.status === "ready",
    );
  },

  setActiveConnection: (connectionId) => {
    set({ activeConnectionId: connectionId });
    get().loadCachedCommands(connectionId);
    // 同步 approvalMode
    const conn = get().connections.find((c) => c.id === connectionId);
    if (conn) {
      ipc.storageSet({
        namespace: "settings",
        key: "approvalMode",
        value: conn.approvalMode,
      });
    }
  },

  updateLastUsedAt: async () => {
    const activeId = get().activeConnectionId;
    if (!activeId) return;
    const connections = get().connections.map((c) =>
      c.id === activeId ? { ...c, lastUsedAt: Date.now() } : c,
    );
    set({ connections });
    await persistConnections(connections);
  },

  reconnectAfterEdit: async (id, data) => {
    // 1. 更新配置并持久化
    const connections = get().connections.map((c) =>
      c.id === id ? { ...c, ...data } : c,
    );
    set({ connections });
    await persistConnections(connections);

    // 2. 如果该连接当前已连接，先断开
    const rt = get().runtimeStates[id];
    if (rt && rt.status !== "disconnected") {
      await get().disconnectAgent(id);
    }

    // 3. 尝试重新连接
    await get().connectAgent(id);
  },

  setStatus: (info) => {
    const connectionId = info.connectionId ?? get().activeConnectionId;
    if (!connectionId) return;

    const current = get().runtimeStates[connectionId];

    // 保护 error 状态：如果当前已经是 error，忽略来自主进程的 disconnected 事件
    // （用户主动断开走的是 disconnectAgent，不经过 setStatus）
    if (current?.status === "error" && info.status === "disconnected") {
      return;
    }

    // 保护 initializing 状态：主进程 initialize() 成功后会发出 ready 事件，
    // 但前端 connectAgent 还需要做 session 验证/认证，由 connectAgent 自己设置 ready
    if (current?.status === "initializing" && info.status === "ready") {
      return;
    }

    set((state) => ({
      runtimeStates: updateRuntime(state.runtimeStates, connectionId, {
        status: info.status,
        agentInfo:
          info.agentInfo ??
          state.runtimeStates[connectionId]?.agentInfo ??
          null,
        agentCapabilities:
          info.agentCapabilities ??
          state.runtimeStates[connectionId]?.agentCapabilities ??
          null,
        error: info.error ?? null,
      }),
    }));
  },
}));

// ============ 响应式 Selector（组件中使用） ============

export const selectStatus = (s: AgentState): AgentStatus => {
  const id = s.activeConnectionId;
  if (!id) return "disconnected";
  return s.runtimeStates[id]?.status ?? "disconnected";
};

export const selectAgentInfo = (s: AgentState) => {
  const id = s.activeConnectionId;
  if (!id) return null;
  return s.runtimeStates[id]?.agentInfo ?? null;
};

export const selectAgentCapabilities = (s: AgentState) => {
  const id = s.activeConnectionId;
  if (!id) return null;
  return s.runtimeStates[id]?.agentCapabilities ?? null;
};

export const selectReadyCount = (s: AgentState): number =>
  Object.values(s.runtimeStates).filter((r) => r.status === "ready").length;

export const selectConnectingCount = (s: AgentState): number =>
  Object.values(s.runtimeStates).filter(
    (r) => r.status === "connecting" || r.status === "initializing",
  ).length;

export const selectAnyReady = (s: AgentState): boolean =>
  Object.values(s.runtimeStates).some((r) => r.status === "ready");
