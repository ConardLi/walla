/**
 * 工具调用状态 Store
 */

import { create } from "zustand";
import type { ToolCall, ToolCallContent } from "@/types/tool-call";

interface ToolCallState {
  /** sessionId → toolCalls */
  toolCallsBySession: Record<string, ToolCall[]>;

  getToolCalls: (sessionId: string) => ToolCall[];

  addToolCall: (
    sessionId: string,
    data: {
      toolCallId: string;
      title: string;
      kind?: string;
      status: string;
    },
  ) => void;

  updateToolCall: (
    sessionId: string,
    data: {
      toolCallId: string;
      status?: string;
      content?: ToolCallContent[];
    },
  ) => void;

  clearSession: (sessionId: string) => void;
  reset: () => void;
}

export const useToolCallStore = create<ToolCallState>((set, get) => ({
  toolCallsBySession: {},

  getToolCalls: (sessionId) => {
    return get().toolCallsBySession[sessionId] ?? [];
  },

  addToolCall: (sessionId, data) => {
    const tc: ToolCall = {
      ...data,
      sessionId,
      content: [],
      timestamp: Date.now(),
    };
    set((state) => ({
      toolCallsBySession: {
        ...state.toolCallsBySession,
        [sessionId]: [...(state.toolCallsBySession[sessionId] ?? []), tc],
      },
    }));
  },

  updateToolCall: (sessionId, data) => {
    set((state) => {
      const calls = [...(state.toolCallsBySession[sessionId] ?? [])];
      const idx = calls.findIndex((c) => c.toolCallId === data.toolCallId);
      if (idx >= 0) {
        const existing = calls[idx];
        calls[idx] = {
          ...existing,
          status: data.status ?? existing.status,
          content: data.content
            ? [...existing.content, ...data.content]
            : existing.content,
        };
      }
      return {
        toolCallsBySession: {
          ...state.toolCallsBySession,
          [sessionId]: calls,
        },
      };
    });
  },

  clearSession: (sessionId) => {
    set((state) => {
      const { [sessionId]: _, ...rest } = state.toolCallsBySession;
      return { toolCallsBySession: rest };
    });
  },

  reset: () => {
    set({ toolCallsBySession: {} });
  },
}));
