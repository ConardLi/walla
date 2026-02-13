/**
 * 权限白名单 Store
 *
 * 管理全局工具白名单和命令白名单（持久化到 storage）
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";

const NAMESPACE = "permissions";

interface PermissionStoreState {
  toolWhitelist: string[];
  commandWhitelist: string[];
  loaded: boolean;

  loadWhitelists: () => Promise<void>;
  addToolToWhitelist: (tool: string) => Promise<void>;
  removeToolFromWhitelist: (tool: string) => Promise<void>;
  addCommandToWhitelist: (cmd: string) => Promise<void>;
  removeCommandFromWhitelist: (cmd: string) => Promise<void>;
}

export const usePermissionStore = create<PermissionStoreState>((set, get) => ({
  toolWhitelist: [],
  commandWhitelist: [],
  loaded: false,

  loadWhitelists: async () => {
    try {
      const [toolRes, cmdRes] = await Promise.all([
        ipc.storageGet({ namespace: NAMESPACE, key: "toolWhitelist" }),
        ipc.storageGet({ namespace: NAMESPACE, key: "commandWhitelist" }),
      ]);
      set({
        toolWhitelist: (toolRes.value as string[] | null) ?? [],
        commandWhitelist: (cmdRes.value as string[] | null) ?? [],
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  addToolToWhitelist: async (tool) => {
    const list = [...get().toolWhitelist];
    if (!list.includes(tool)) {
      list.push(tool);
      set({ toolWhitelist: list });
      await ipc.storageSet({
        namespace: NAMESPACE,
        key: "toolWhitelist",
        value: list,
      });
    }
  },

  removeToolFromWhitelist: async (tool) => {
    const list = get().toolWhitelist.filter((t) => t !== tool);
    set({ toolWhitelist: list });
    await ipc.storageSet({
      namespace: NAMESPACE,
      key: "toolWhitelist",
      value: list,
    });
  },

  addCommandToWhitelist: async (cmd) => {
    const list = [...get().commandWhitelist];
    if (!list.includes(cmd)) {
      list.push(cmd);
      set({ commandWhitelist: list });
      await ipc.storageSet({
        namespace: NAMESPACE,
        key: "commandWhitelist",
        value: list,
      });
    }
  },

  removeCommandFromWhitelist: async (cmd) => {
    const list = get().commandWhitelist.filter((c) => c !== cmd);
    set({ commandWhitelist: list });
    await ipc.storageSet({
      namespace: NAMESPACE,
      key: "commandWhitelist",
      value: list,
    });
  },
}));
