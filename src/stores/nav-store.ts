/**
 * 导航状态 Store
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type { NavPage, TaskListGroupMode } from "@/types/nav";

interface NavState {
  activePage: NavPage;
  taskListCollapsed: boolean;
  taskListGroupMode: TaskListGroupMode;
  navLoaded: boolean;
  loadNavSettings: () => Promise<void>;
  setActivePage: (page: NavPage) => void;
  toggleTaskList: () => void;
  setTaskListCollapsed: (collapsed: boolean) => void;
  setTaskListGroupMode: (mode: TaskListGroupMode) => void;
}

async function persistTaskListCollapsed(collapsed: boolean) {
  await ipc.storageSet({
    namespace: "settings",
    key: "taskListCollapsed",
    value: collapsed,
  });
}

async function persistTaskListGroupMode(mode: TaskListGroupMode) {
  await ipc.storageSet({
    namespace: "settings",
    key: "taskListGroupMode",
    value: mode,
  });
}

export const useNavStore = create<NavState>((set, get) => ({
  activePage: "task",
  taskListCollapsed: true,
  taskListGroupMode: "time",
  navLoaded: false,

  loadNavSettings: async () => {
    try {
      // 加载 taskListCollapsed
      const collapsedRes = await ipc.storageGet({
        namespace: "settings",
        key: "taskListCollapsed",
      });
      const collapsed =
        typeof collapsedRes.value === "boolean" ? collapsedRes.value : true;

      // 加载 taskListGroupMode
      const groupModeRes = await ipc.storageGet({
        namespace: "settings",
        key: "taskListGroupMode",
      });
      const groupMode = (groupModeRes.value as TaskListGroupMode) || "time";

      set({
        taskListCollapsed: collapsed,
        taskListGroupMode: groupMode,
        navLoaded: true,
      });
    } catch {
      set({ navLoaded: true });
    }
  },

  setActivePage: (page) => set({ activePage: page }),

  toggleTaskList: () => {
    const next = !get().taskListCollapsed;
    set({ taskListCollapsed: next });
    persistTaskListCollapsed(next);
  },

  setTaskListCollapsed: (collapsed) => {
    set({ taskListCollapsed: collapsed });
    persistTaskListCollapsed(collapsed);
  },

  setTaskListGroupMode: (mode) => {
    set({ taskListGroupMode: mode });
    persistTaskListGroupMode(mode);
  },
}));
