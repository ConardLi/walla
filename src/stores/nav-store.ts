/**
 * 导航状态 Store
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type { NavPage, TaskListGroupMode } from "@/types/nav";

export type TaskListViewMode = "normal" | "compact";

interface NavState {
  activePage: NavPage;
  taskListCollapsed: boolean;
  taskListGroupMode: TaskListGroupMode;
  taskListViewMode: TaskListViewMode;
  navLoaded: boolean;
  loadNavSettings: () => Promise<void>;
  setActivePage: (page: NavPage) => void;
  toggleTaskList: () => void;
  setTaskListCollapsed: (collapsed: boolean) => void;
  setTaskListGroupMode: (mode: TaskListGroupMode) => void;
  setTaskListViewMode: (mode: TaskListViewMode) => void;
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

async function persistTaskListViewMode(mode: TaskListViewMode) {
  await ipc.storageSet({
    namespace: "settings",
    key: "taskListViewMode",
    value: mode,
  });
}

export const useNavStore = create<NavState>((set, get) => ({
  activePage: "task",
  taskListCollapsed: true,
  taskListGroupMode: "time",
  taskListViewMode: "compact",
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

      // 加载 taskListViewMode（默认 compact）
      const viewModeRes = await ipc.storageGet({
        namespace: "settings",
        key: "taskListViewMode",
      });
      const viewMode = (viewModeRes.value as TaskListViewMode) || "compact";

      set({
        taskListCollapsed: collapsed,
        taskListGroupMode: groupMode,
        taskListViewMode: viewMode,
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

  setTaskListViewMode: (mode) => {
    set({ taskListViewMode: mode });
    persistTaskListViewMode(mode);
  },
}));
