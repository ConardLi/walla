/**
 * MCP Server 管理 Store
 *
 * 管理 MCP Server 配置（持久化）和运行时状态（内存）
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type {
  MCPServerConfig,
  MCPServerRuntime,
  MCPServerStatus,
} from "@/types/mcp";

const STORAGE_NAMESPACE = "mcp";
const STORAGE_KEY = "servers";

interface MCPState {
  /** 已保存的 MCP Server 配置列表 */
  servers: MCPServerConfig[];
  /** 运行时状态 serverId → runtime */
  runtimes: Record<string, MCPServerRuntime>;
  /** 是否已加载 */
  loaded: boolean;

  /** 从本地存储加载配置 */
  loadServers: () => Promise<void>;
  /** 添加并连接 MCP Server */
  addServer: (
    config: MCPServerConfig,
  ) => Promise<{ success: boolean; error?: string }>;
  /** 更新 Server 配置（断开旧连接，重新连接） */
  updateServer: (
    config: MCPServerConfig,
  ) => Promise<{ success: boolean; error?: string }>;
  /** 删除 Server */
  removeServer: (serverId: string) => Promise<void>;
  /** 连接已保存的 Server */
  connectServer: (
    serverId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  /** 断开 Server */
  disconnectServer: (serverId: string) => Promise<void>;
  /** 刷新 Server 的工具/提示词/资源 */
  refreshServer: (serverId: string) => Promise<void>;
}

const DEFAULT_RUNTIME: MCPServerRuntime = {
  status: "disconnected",
  tools: [],
  prompts: [],
  resources: [],
};

function createRuntime(): MCPServerRuntime {
  return {
    status: "disconnected",
    tools: [],
    prompts: [],
    resources: [],
  };
}

function updateRuntime(
  runtimes: Record<string, MCPServerRuntime>,
  serverId: string,
  patch: Partial<MCPServerRuntime>,
): Record<string, MCPServerRuntime> {
  return {
    ...runtimes,
    [serverId]: { ...(runtimes[serverId] ?? createRuntime()), ...patch },
  };
}

async function persistServers(servers: MCPServerConfig[]) {
  try {
    await ipc.storageSet({
      namespace: STORAGE_NAMESPACE,
      key: STORAGE_KEY,
      value: servers,
    });
  } catch (err) {
    console.error("[MCP Store] Failed to persist servers:", err);
  }
}

export const useMCPStore = create<MCPState>((set, get) => ({
  servers: [],
  runtimes: {},
  loaded: false,

  loadServers: async () => {
    try {
      const res = await ipc.storageGet({
        namespace: STORAGE_NAMESPACE,
        key: STORAGE_KEY,
      });
      const servers = Array.isArray(res.value)
        ? (res.value as MCPServerConfig[])
        : [];
      set({ servers, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addServer: async (config) => {
    // 设置 connecting 状态
    set((state) => ({
      runtimes: updateRuntime(state.runtimes, config.id, {
        status: "connecting",
      }),
    }));

    // 尝试连接
    const result = await ipc.mcpConnect({ config });

    if (!result.success) {
      set((state) => ({
        runtimes: updateRuntime(state.runtimes, config.id, {
          status: "error",
          error: result.error,
        }),
      }));
      return { success: false, error: result.error };
    }

    // 连接成功，保存配置
    const serverWithTime: MCPServerConfig = {
      ...config,
      lastConnectedAt: Date.now(),
    };

    set((state) => {
      const servers = [...state.servers, serverWithTime];
      persistServers(servers);
      return {
        servers,
        runtimes: updateRuntime(state.runtimes, config.id, {
          status: "connected",
          tools: result.tools,
          prompts: result.prompts,
          resources: result.resources,
          serverInfo: result.serverInfo,
          error: undefined,
        }),
      };
    });

    return { success: true };
  },

  updateServer: async (config) => {
    // 先断开旧连接
    await get().disconnectServer(config.id);

    // 设置 connecting 状态
    set((state) => ({
      runtimes: updateRuntime(state.runtimes, config.id, {
        status: "connecting",
      }),
    }));

    // 尝试连接
    const result = await ipc.mcpConnect({ config });

    if (!result.success) {
      set((state) => ({
        runtimes: updateRuntime(state.runtimes, config.id, {
          status: "error",
          error: result.error,
        }),
      }));
      return { success: false, error: result.error };
    }

    // 连接成功，更新配置
    const serverWithTime: MCPServerConfig = {
      ...config,
      lastConnectedAt: Date.now(),
    };

    set((state) => {
      const servers = state.servers.map((s) =>
        s.id === config.id ? serverWithTime : s,
      );
      persistServers(servers);
      return {
        servers,
        runtimes: updateRuntime(state.runtimes, config.id, {
          status: "connected",
          tools: result.tools,
          prompts: result.prompts,
          resources: result.resources,
          serverInfo: result.serverInfo,
          error: undefined,
        }),
      };
    });

    return { success: true };
  },

  removeServer: async (serverId) => {
    await get().disconnectServer(serverId);
    set((state) => {
      const servers = state.servers.filter((s) => s.id !== serverId);
      const { [serverId]: _, ...runtimes } = state.runtimes;
      persistServers(servers);
      return { servers, runtimes };
    });
  },

  connectServer: async (serverId) => {
    const config = get().servers.find((s) => s.id === serverId);
    if (!config) return { success: false, error: "Server 不存在" };

    set((state) => ({
      runtimes: updateRuntime(state.runtimes, serverId, {
        status: "connecting",
      }),
    }));

    const result = await ipc.mcpConnect({ config });

    if (!result.success) {
      set((state) => ({
        runtimes: updateRuntime(state.runtimes, serverId, {
          status: "error",
          error: result.error,
        }),
      }));
      return { success: false, error: result.error };
    }

    set((state) => {
      const servers = state.servers.map((s) =>
        s.id === serverId ? { ...s, lastConnectedAt: Date.now() } : s,
      );
      persistServers(servers);
      return {
        servers,
        runtimes: updateRuntime(state.runtimes, serverId, {
          status: "connected",
          tools: result.tools,
          prompts: result.prompts,
          resources: result.resources,
          serverInfo: result.serverInfo,
          error: undefined,
        }),
      };
    });

    return { success: true };
  },

  disconnectServer: async (serverId) => {
    try {
      await ipc.mcpDisconnect({ serverId });
    } catch {
      /* ignore */
    }
    set((state) => ({
      runtimes: updateRuntime(state.runtimes, serverId, {
        status: "disconnected",
        tools: [],
        prompts: [],
        resources: [],
        error: undefined,
      }),
    }));
  },

  refreshServer: async (serverId) => {
    const result = await ipc.mcpRefresh({ serverId });
    if (result.success) {
      set((state) => ({
        runtimes: updateRuntime(state.runtimes, serverId, {
          tools: result.tools,
          prompts: result.prompts,
          resources: result.resources,
        }),
      }));
    }
  },
}));

/** 获取指定 server 的运行时状态 */
export function selectMCPRuntime(
  state: MCPState,
  serverId: string,
): MCPServerRuntime {
  return state.runtimes[serverId] ?? DEFAULT_RUNTIME;
}

/** 获取指定 server 的状态 */
export function selectMCPStatus(
  state: MCPState,
  serverId: string,
): MCPServerStatus {
  return state.runtimes[serverId]?.status ?? "disconnected";
}
