/**
 * 会话管理 Store
 *
 * SessionInfo: 运行时会话状态
 * SessionMeta: 持久化的会话元信息（历史记录）
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import { useMessageStore } from "@/stores/message-store";
import { cleanErrorMessage } from "@/lib/error-utils";
import { isAuthRequiredError, performAuth } from "@/lib/auth-utils";
import type { McpServerConfig } from "@/shared/ipc-types";
import type {
  SessionConfigOption,
  ModelInfo,
  SessionInfo,
  SessionMeta,
} from "@/types/session";

interface SessionState {
  sessions: SessionInfo[];
  sessionMetas: SessionMeta[];
  metasLoaded: boolean;
  activeSessionId: string | null;
  isCreating: boolean;
  error: string | null;

  getActiveSession: () => SessionInfo | undefined;

  loadSessionMetas: () => Promise<void>;
  createSession: (
    cwd: string,
    options?: { mcpServers?: McpServerConfig[]; persist?: boolean },
  ) => Promise<string>;
  persistCurrentSession: () => Promise<void>;
  changeCwd: (sessionId: string, newCwd: string) => void;
  loadSession: (
    sessionId: string,
    cwd: string,
    mcpServers?: McpServerConfig[],
  ) => Promise<void>;
  setActiveSession: (sessionId: string) => void;
  switchToSession: (sessionId: string) => Promise<void>;
  updateLastActiveAt: (sessionId: string) => Promise<void>;
  setMode: (sessionId: string, modeId: string) => Promise<void>;
  setModel: (sessionId: string, modelId: string) => Promise<void>;
  setConfigOption: (
    sessionId: string,
    configId: string,
    value: string,
  ) => Promise<void>;

  updateSessionModes: (sessionId: string, currentModeId: string) => void;
  updateSessionModels: (
    sessionId: string,
    models: { availableModels: ModelInfo[]; currentModelId: string },
  ) => void;
  updateSessionConfig: (
    sessionId: string,
    configOptions: SessionConfigOption[],
  ) => void;
  updateSessionCommands: (
    sessionId: string,
    commands: SessionInfo["availableCommands"],
  ) => void;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  removeSession: (sessionId: string) => Promise<void>;
  toggleFavorite: (sessionId: string) => Promise<void>;
  reset: () => void;
}

async function persistSessionMetas(metas: SessionMeta[]) {
  await ipc.storageSet({
    namespace: "sessions",
    key: "metas",
    value: metas,
  });
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  sessionMetas: [],
  metasLoaded: false,
  activeSessionId: null,
  isCreating: false,
  error: null,

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.sessionId === activeSessionId);
  },

  loadSessionMetas: async () => {
    try {
      const result = await ipc.storageGet({
        namespace: "sessions",
        key: "metas",
      });
      const metas = (result.value as SessionMeta[] | null) ?? [];
      set({ sessionMetas: metas, metasLoaded: true });
    } catch {
      set({ metasLoaded: true });
    }
  },

  createSession: async (cwd, options) => {
    const { mcpServers, persist = true } = options ?? {};
    set({ isCreating: true, error: null });
    try {
      const { useAgentStore: getAgentStore, selectAgentInfo: getInfo } =
        await import("@/stores/agent-store");
      const agentState = getAgentStore.getState();
      const connectionId = agentState.activeConnectionId;
      if (!connectionId) throw new Error("No active agent connection");

      let result;
      try {
        result = await ipc.sessionNew({ connectionId, cwd, mcpServers });
      } catch (sessionErr) {
        const errMsg = cleanErrorMessage((sessionErr as Error).message);
        const rt = getAgentStore.getState().runtimeStates[connectionId];
        const authMethods = rt?.authMethods ?? [];

        if (isAuthRequiredError(errMsg) && authMethods.length > 0) {
          const connObj = agentState.connections.find(
            (c) => c.id === connectionId,
          );
          const agentLabel =
            connObj?.name ?? getInfo(agentState)?.name ?? "Agent";
          const ok = await performAuth(connectionId, agentLabel, authMethods);
          if (!ok) throw new Error("用户取消了认证");
          result = await ipc.sessionNew({ connectionId, cwd, mcpServers });
        } else {
          throw sessionErr;
        }
      }
      const session: SessionInfo = {
        sessionId: result.sessionId,
        cwd,
        modes: result.modes,
        models: result.models as SessionInfo["models"],
        configOptions: result.configOptions,
      };

      // 检查是否有该 Agent 上次使用的模型（无论 persist 与否都需要切换）
      const { useSettingsStore } = await import("@/stores/settings-store");
      const latestAgentState = getAgentStore.getState();
      const activeConn = latestAgentState.connections.find(
        (c) => c.id === latestAgentState.activeConnectionId,
      );
      const agentConnectionId =
        latestAgentState.activeConnectionId ?? undefined;
      const agentName = activeConn?.name ?? getInfo(latestAgentState)?.name;

      let effectiveModelId = (result.models as SessionInfo["models"])
        ?.currentModelId;
      if (agentName) {
        const savedModelId = useSettingsStore
          .getState()
          .getLastModel(agentName);
        const availableModels = (result.models as SessionInfo["models"])
          ?.availableModels;
        if (
          savedModelId &&
          availableModels?.some((m) => m.modelId === savedModelId)
        ) {
          effectiveModelId = savedModelId;
          // 更新运行时 session 的 models
          session.models = session.models
            ? { ...session.models, currentModelId: savedModelId }
            : undefined;
          // 通知 Agent 切换模型（异步，不阻塞）
          const modelConfigOpt = session.configOptions?.find(
            (o) => o.category === "model",
          );
          if (modelConfigOpt) {
            ipc
              .sessionSetConfig({
                sessionId: result.sessionId,
                configId: modelConfigOpt.id,
                value: savedModelId,
              })
              .catch(() => {});
          } else {
            ipc
              .sessionSetModel({
                sessionId: result.sessionId,
                modelId: savedModelId,
              })
              .catch(() => {});
          }
        }
      }

      if (persist) {
        const meta: SessionMeta = {
          sessionId: result.sessionId,
          cwd,
          agentConnectionId,
          agentName,
          modelId: effectiveModelId,
          modelName: (
            result.models as SessionInfo["models"]
          )?.availableModels.find((m) => m.modelId === effectiveModelId)?.name,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        };
        const metas = [meta, ...get().sessionMetas];
        set((state) => ({
          sessions: [...state.sessions, session],
          sessionMetas: metas,
          activeSessionId: result.sessionId,
          isCreating: false,
        }));
        await persistSessionMetas(metas);
      } else {
        set((state) => ({
          sessions: [...state.sessions, session],
          activeSessionId: result.sessionId,
          isCreating: false,
        }));
      }
      return result.sessionId;
    } catch (err) {
      set({ isCreating: false, error: (err as Error).message });
      throw err;
    }
  },

  loadSession: async (sessionId, cwd, mcpServers) => {
    set({ isCreating: true, error: null });
    try {
      const msgStore = useMessageStore.getState();
      // 加载前清空该 session 的旧消息，并标记为回放模式
      msgStore.clearSession(sessionId);
      msgStore.setReplaying(sessionId);

      // 从 meta 中获取 connectionId，fallback 到当前活跃连接
      const meta = get().sessionMetas.find((m) => m.sessionId === sessionId);
      const { useAgentStore: getAgentStore2, selectAgentInfo: getInfo2 } =
        await import("@/stores/agent-store");
      const { useLoadingStore } = await import("@/stores/loading-store");
      const agentStore = getAgentStore2.getState();
      const loadingStore = useLoadingStore.getState();

      const connectionId =
        meta?.agentConnectionId ?? agentStore.activeConnectionId ?? "";

      // 获取 Agent 名称用于显示
      const connObj = agentStore.connections.find((c) => c.id === connectionId);
      const agentName = connObj?.name ?? "Agent";

      // 检查该 connectionId 对应的 Agent 是否已连接
      const runtimeState = agentStore.runtimeStates[connectionId];
      const isConnected = runtimeState?.status === "ready";

      if (!isConnected && connectionId) {
        // Agent 未连接，显示 Loading 并尝试连接
        loadingStore.showLoading(`正在连接 ${agentName}，请稍后....`);
        try {
          await agentStore.connectAgent(connectionId);
        } catch (connectErr) {
          loadingStore.hideLoading();
          throw new Error(
            `无法加载会话：Agent 连接失败 - ${(connectErr as Error).message}`,
          );
        }
        loadingStore.hideLoading();
      }

      const loadParams = { connectionId, sessionId, cwd, mcpServers };

      let result;
      try {
        result = await ipc.sessionLoad(loadParams);
      } catch (loadErr) {
        const errMsg = cleanErrorMessage((loadErr as Error).message);
        const rt = getAgentStore2.getState().runtimeStates[connectionId];
        const authMethods = rt?.authMethods ?? [];

        if (isAuthRequiredError(errMsg) && authMethods.length > 0) {
          const as2 = getAgentStore2.getState();
          const connObj = as2.connections.find((c) => c.id === connectionId);
          const agentLabel = connObj?.name ?? getInfo2(as2)?.name ?? "Agent";
          const ok = await performAuth(connectionId, agentLabel, authMethods);
          if (!ok) throw new Error("用户取消了认证");
          result = await ipc.sessionLoad(loadParams);
        } else {
          throw loadErr;
        }
      }
      set((state) => {
        // 回放期间可能已收到 available_commands_update 等事件，需要保留
        const existing = state.sessions.find((s) => s.sessionId === sessionId);
        const session: SessionInfo = {
          sessionId,
          cwd,
          modes: result.modes,
          models: result.models as SessionInfo["models"],
          configOptions: result.configOptions,
          availableCommands: existing?.availableCommands,
        };
        return {
          sessions: existing
            ? state.sessions.map((s) =>
                s.sessionId === sessionId ? session : s,
              )
            : [...state.sessions, session],
          activeSessionId: sessionId,
          isCreating: false,
        };
      });

      // 回放完成，取消回放模式并 finalize
      useMessageStore.getState().clearReplaying(sessionId);
      useMessageStore.getState().finalizeStreaming(sessionId);
    } catch (err) {
      useMessageStore.getState().clearReplaying(sessionId);
      set({ isCreating: false, error: (err as Error).message });
      throw err;
    }
  },

  persistCurrentSession: async () => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    // 如果已经在 metas 中，说明已持久化，跳过
    if (get().sessionMetas.some((m) => m.sessionId === sessionId)) return;
    const session = get().sessions.find((s) => s.sessionId === sessionId);
    if (!session) return;
    const { useAgentStore } = await import("@/stores/agent-store");
    const agentState = useAgentStore.getState();
    const activeConn = agentState.connections.find(
      (c) => c.id === agentState.activeConnectionId,
    );
    const meta: SessionMeta = {
      sessionId,
      cwd: session.cwd,
      agentConnectionId: agentState.activeConnectionId ?? undefined,
      agentName:
        activeConn?.name ??
        (await import("@/stores/agent-store")).selectAgentInfo(agentState)
          ?.name,
      modelId: session.models?.currentModelId,
      modelName: session.models?.availableModels.find(
        (m) => m.modelId === session.models?.currentModelId,
      )?.name,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    const metas = [meta, ...get().sessionMetas];
    set({ sessionMetas: metas });
    await persistSessionMetas(metas);
  },

  changeCwd: (sessionId, newCwd) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId ? { ...s, cwd: newCwd } : s,
      ),
    }));
  },

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId });
  },

  switchToSession: async (sessionId) => {
    // 如果该 session 已在运行时列表中，直接切换
    const existing = get().sessions.find((s) => s.sessionId === sessionId);
    if (existing) {
      get().setActiveSession(sessionId);
      return;
    }
    // 立即切换 activeSessionId，让 UI 即时响应（显示骨架屏）
    set({ activeSessionId: sessionId });
    // 从历史中找到 meta，通过 loadSession 加载
    const meta = get().sessionMetas.find((m) => m.sessionId === sessionId);
    if (meta) {
      await get().loadSession(sessionId, meta.cwd);
    }
  },

  updateLastActiveAt: async (sessionId) => {
    const metas = get().sessionMetas.map((m) =>
      m.sessionId === sessionId ? { ...m, lastActiveAt: Date.now() } : m,
    );
    set({ sessionMetas: metas });
    await persistSessionMetas(metas);
  },

  setMode: async (sessionId, modeId) => {
    // 乐观更新
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId && s.modes
          ? { ...s, modes: { ...s.modes, currentModeId: modeId } }
          : s,
      ),
    }));
    try {
      // ACP 协议: 优先使用 configOptions API (session/set_config_option)
      const session = get().sessions.find((s) => s.sessionId === sessionId);
      const modeConfigOpt = session?.configOptions?.find(
        (o) => o.category === "mode",
      );
      if (modeConfigOpt) {
        await ipc.sessionSetConfig({
          sessionId,
          configId: modeConfigOpt.id,
          value: modeId,
        });
      } else {
        await ipc.sessionSetMode({ sessionId, modeId });
      }
    } catch (err) {
      console.error("[setMode] failed:", err);
    }
  },

  setModel: async (sessionId, modelId) => {
    // 乐观更新
    const session = get().sessions.find((s) => s.sessionId === sessionId);
    const modelName = session?.models?.availableModels.find(
      (m) => m.modelId === modelId,
    )?.name;
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId && s.models
          ? { ...s, models: { ...s.models, currentModelId: modelId } }
          : s,
      ),
    }));
    // 同步更新 meta
    const metas = get().sessionMetas.map((m) =>
      m.sessionId === sessionId ? { ...m, modelId, modelName } : m,
    );
    set({ sessionMetas: metas });
    persistSessionMetas(metas);
    try {
      // ACP 协议: 优先使用 configOptions API (session/set_config_option)
      const sess = get().sessions.find((s) => s.sessionId === sessionId);
      const modelConfigOpt = sess?.configOptions?.find(
        (o) => o.category === "model",
      );
      if (modelConfigOpt) {
        await ipc.sessionSetConfig({
          sessionId,
          configId: modelConfigOpt.id,
          value: modelId,
        });
      } else {
        await ipc.sessionSetModel({ sessionId, modelId });
      }
    } catch (err) {
      console.error("[setModel] failed:", err);
    }
  },

  setConfigOption: async (sessionId, configId, value) => {
    await ipc.sessionSetConfig({ sessionId, configId, value });
  },

  updateSessionModes: (sessionId, currentModeId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId && s.modes
          ? { ...s, modes: { ...s.modes, currentModeId } }
          : s,
      ),
    }));
  },

  updateSessionModels: (sessionId, models) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId
          ? {
              ...s,
              models: {
                availableModels: models.availableModels,
                currentModelId: models.currentModelId,
              },
            }
          : s,
      ),
    }));
  },

  updateSessionConfig: (sessionId, configOptions) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.sessionId !== sessionId) return s;
        const updated: SessionInfo = { ...s, configOptions };
        // 从 configOptions 同步 modes/models 的 currentValue
        const modeOpt = configOptions.find(
          (o: SessionConfigOption) => o.category === "mode",
        );
        if (modeOpt?.currentValue && updated.modes) {
          updated.modes = {
            ...updated.modes,
            currentModeId: modeOpt.currentValue,
          };
        }
        const modelOpt = configOptions.find(
          (o: SessionConfigOption) => o.category === "model",
        );
        if (modelOpt?.currentValue && updated.models) {
          updated.models = {
            ...updated.models,
            currentModelId: modelOpt.currentValue,
          };
        }
        return updated;
      }),
    }));
  },

  updateSessionCommands: (sessionId, commands) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId ? { ...s, availableCommands: commands } : s,
      ),
    }));
  },

  updateSessionTitle: async (sessionId, title) => {
    const metas = get().sessionMetas.map((m) =>
      m.sessionId === sessionId ? { ...m, title } : m,
    );
    set({ sessionMetas: metas });
    await persistSessionMetas(metas);
  },

  removeSession: async (sessionId) => {
    const metas = get().sessionMetas.filter((m) => m.sessionId !== sessionId);
    const sessions = get().sessions.filter((s) => s.sessionId !== sessionId);
    const activeSessionId =
      get().activeSessionId === sessionId ? null : get().activeSessionId;
    set({ sessionMetas: metas, sessions, activeSessionId });
    // 清除该 session 的消息
    useMessageStore.getState().clearSession(sessionId);
    await persistSessionMetas(metas);
  },

  toggleFavorite: async (sessionId) => {
    const metas = get().sessionMetas.map((m) =>
      m.sessionId === sessionId ? { ...m, favorited: !m.favorited } : m,
    );
    set({ sessionMetas: metas });
    await persistSessionMetas(metas);
  },

  reset: () => {
    set({
      sessions: [],
      activeSessionId: null,
      isCreating: false,
      error: null,
    });
  },
}));
