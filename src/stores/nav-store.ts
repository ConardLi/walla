/**
 * 导航状态 Store
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type { NavPage, TaskListGroupMode, TaskListSortMode } from "@/types/nav";

export type TaskListViewMode = "normal" | "compact";

interface NavState {
  activePage: NavPage;
  taskListCollapsed: boolean;
  taskListGroupMode: TaskListGroupMode;
  taskListSortMode: TaskListSortMode;
  taskListViewMode: TaskListViewMode;
  navLoaded: boolean;
  loadNavSettings: () => Promise<void>;
  setActivePage: (page: NavPage) => void;
  toggleTaskList: () => void;
  setTaskListCollapsed: (collapsed: boolean) => void;
  setTaskListGroupMode: (mode: TaskListGroupMode) => void;
  setTaskListSortMode: (mode: TaskListSortMode) => void;
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

async function persistTaskListSortMode(mode: TaskListSortMode) {
  await ipc.storageSet({
    namespace: "settings",
    key: "taskListSortMode",
    value: mode,
  });
}

export const useNavStore = create<NavState>((set, get) => ({
  activePage: "task",
  taskListCollapsed: true,
  taskListGroupMode: "time",
  taskListSortMode: "updated",
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

      // 加载 taskListSortMode
      const sortModeRes = await ipc.storageGet({
        namespace: "settings",
        key: "taskListSortMode",
      });
      const sortMode = (sortModeRes.value as TaskListSortMode) || "updated";

      // 加载 taskListViewMode（默认 compact）
      const viewModeRes = await ipc.storageGet({
        namespace: "settings",
        key: "taskListViewMode",
      });
      const viewMode = (viewModeRes.value as TaskListViewMode) || "compact";

      set({
        taskListCollapsed: collapsed,
        taskListGroupMode: groupMode,
        taskListSortMode: sortMode,
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

  setTaskListSortMode: (mode) => {
    set({ taskListSortMode: mode });
    persistTaskListSortMode(mode);
  },
}));
