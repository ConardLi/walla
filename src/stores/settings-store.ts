/**
 * 全局设置 Store
 *
 * 主题管理 + Agent 默认模型记忆 + 权限白名单（后续完善）
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type { ThemeMode, LastModelByAgent } from "@/types/settings";

interface SettingsState {
  theme: ThemeMode;
  loaded: boolean;
  lastModelByAgent: LastModelByAgent;

  loadSettings: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLastModel: (agentName: string, modelId: string) => Promise<void>;
  getLastModel: (agentName: string) => string | undefined;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "system",
  loaded: false,
  lastModelByAgent: {},

  loadSettings: async () => {
    try {
      const [themeResult, modelResult] = await Promise.all([
        ipc.storageGet({ namespace: "settings", key: "theme" }),
        ipc.storageGet({ namespace: "settings", key: "lastModelByAgent" }),
      ]);
      const theme = (themeResult.value as ThemeMode) ?? "system";
      const lastModelByAgent = (modelResult.value as LastModelByAgent) ?? {};
      set({ theme, lastModelByAgent, loaded: true });
      applyTheme(theme);
    } catch {
      set({ loaded: true });
    }
  },

  setTheme: async (theme) => {
    set({ theme });
    applyTheme(theme);
    await ipc.storageSet({ namespace: "settings", key: "theme", value: theme });
  },

  setLastModel: async (agentName, modelId) => {
    const updated = { ...get().lastModelByAgent, [agentName]: modelId };
    set({ lastModelByAgent: updated });
    await ipc.storageSet({
      namespace: "settings",
      key: "lastModelByAgent",
      value: updated,
    });
  },

  getLastModel: (agentName) => {
    return get().lastModelByAgent[agentName];
  },
}));

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.classList.toggle("dark", prefersDark);
    root.classList.toggle("light", !prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }
}
