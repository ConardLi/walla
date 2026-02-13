/**
 * 通信日志 Store
 *
 * 记录所有 IPC 通信（发送请求 + 接收事件），支持筛选和分页
 */

import { create } from "zustand";
import type { LogDirection, LogCategory, UpdateLogEntry } from "@/types/log";

interface UpdateLogState {
  entries: UpdateLogEntry[];
  maxEntries: number;

  addEntry: (params: {
    sessionId: string;
    direction: LogDirection;
    category: LogCategory;
    method: string;
    raw: unknown;
  }) => void;
  clear: () => void;
}

let logIdCounter = 0;

export const useUpdateLogStore = create<UpdateLogState>((set) => ({
  entries: [],
  maxEntries: 2000,

  addEntry: ({ sessionId, direction, category, method, raw }) => {
    const entry: UpdateLogEntry = {
      id: `log-${++logIdCounter}`,
      sessionId,
      timestamp: Date.now(),
      direction,
      category,
      method,
      raw,
    };
    set((state) => {
      const entries = [...state.entries, entry];
      if (entries.length > state.maxEntries) {
        entries.splice(0, entries.length - state.maxEntries);
      }
      return { entries };
    });
  },

  clear: () => set({ entries: [] }),
}));
