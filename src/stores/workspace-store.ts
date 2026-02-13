/**
 * 工作目录 Store
 *
 * 持久化管理已使用过的工作目录列表
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";

interface WorkspaceState {
  directories: string[];
  loaded: boolean;

  loadDirectories: () => Promise<void>;
  addDirectory: (dir: string) => Promise<void>;
  removeDirectory: (dir: string) => Promise<void>;
}

async function persistDirectories(dirs: string[]) {
  await ipc.storageSet({
    namespace: "workspace",
    key: "directories",
    value: dirs,
  });
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  directories: [],
  loaded: false,

  loadDirectories: async () => {
    try {
      const result = await ipc.storageGet({
        namespace: "workspace",
        key: "directories",
      });
      const dirs = (result.value as string[] | null) ?? [];
      set({ directories: dirs, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addDirectory: async (dir) => {
    const existing = get().directories;
    if (existing.includes(dir)) return;
    const dirs = [dir, ...existing];
    set({ directories: dirs });
    await persistDirectories(dirs);
  },

  removeDirectory: async (dir) => {
    const dirs = get().directories.filter((d) => d !== dir);
    set({ directories: dirs });
    await persistDirectories(dirs);
  },
}));
