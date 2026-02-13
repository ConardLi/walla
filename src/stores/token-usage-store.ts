/**
 * Token 消耗记录 Store
 *
 * 独立存储每次对话的 Token 消耗明细，用于后续统计看板
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type { TokenUsage, TokenUsageRecord } from "@/types/token-usage";

interface TokenUsageState {
  /** sessionId → 累计 usage */
  cumulativeBySession: Record<string, TokenUsage>;
  /** sessionId → 本轮 usage（最新一次对话） */
  latestBySession: Record<string, TokenUsage>;

  getCumulative: (sessionId: string) => TokenUsage | undefined;
  getLatest: (sessionId: string) => TokenUsage | undefined;

  /** 记录一次对话的 token 消耗（累加到累计 + 存储独立记录） */
  recordUsage: (
    sessionId: string,
    usage: TokenUsage,
    meta?: { agentName?: string; modelId?: string; modelName?: string },
  ) => Promise<void>;

  /** 加载某个 session 的累计消耗 */
  loadSessionUsage: (sessionId: string) => Promise<void>;
}

let recordIdCounter = 0;
function nextRecordId() {
  return `tr-${++recordIdCounter}-${Date.now()}`;
}

function addUsage(a: TokenUsage | undefined, b: TokenUsage): TokenUsage {
  return {
    totalTokens: (a?.totalTokens ?? 0) + (b.totalTokens ?? 0),
    inputTokens: (a?.inputTokens ?? 0) + (b.inputTokens ?? 0),
    outputTokens: (a?.outputTokens ?? 0) + (b.outputTokens ?? 0),
    thoughtTokens: (a?.thoughtTokens ?? 0) + (b.thoughtTokens ?? 0),
    cachedReadTokens: (a?.cachedReadTokens ?? 0) + (b.cachedReadTokens ?? 0),
  };
}

export const useTokenUsageStore = create<TokenUsageState>((set, get) => ({
  cumulativeBySession: {},
  latestBySession: {},

  getCumulative: (sessionId) => get().cumulativeBySession[sessionId],
  getLatest: (sessionId) => get().latestBySession[sessionId],

  recordUsage: async (sessionId, usage, meta) => {
    // 更新内存中的累计和最新
    const prev = get().cumulativeBySession[sessionId];
    const cumulative = addUsage(prev, usage);

    set((state) => ({
      cumulativeBySession: {
        ...state.cumulativeBySession,
        [sessionId]: cumulative,
      },
      latestBySession: {
        ...state.latestBySession,
        [sessionId]: usage,
      },
    }));

    // 持久化累计到 storage
    await ipc
      .storageSet({
        namespace: "token_usage",
        key: `cumulative:${sessionId}`,
        value: cumulative,
      })
      .catch(() => {});

    // 持久化独立记录（追加到列表）
    const record: TokenUsageRecord = {
      id: nextRecordId(),
      sessionId,
      agentName: meta?.agentName,
      modelId: meta?.modelId,
      modelName: meta?.modelName,
      usage,
      timestamp: Date.now(),
    };

    try {
      const existing = await ipc.storageGet({
        namespace: "token_usage",
        key: `records:${sessionId}`,
      });
      const records = (existing.value as TokenUsageRecord[] | null) ?? [];
      records.push(record);
      await ipc.storageSet({
        namespace: "token_usage",
        key: `records:${sessionId}`,
        value: records,
      });
    } catch {
      // best-effort
    }
  },

  loadSessionUsage: async (sessionId) => {
    try {
      const result = await ipc.storageGet({
        namespace: "token_usage",
        key: `cumulative:${sessionId}`,
      });
      const cumulative = result.value as TokenUsage | null;
      if (cumulative) {
        set((state) => ({
          cumulativeBySession: {
            ...state.cumulativeBySession,
            [sessionId]: cumulative,
          },
        }));
      }
    } catch {
      // best-effort
    }
  },
}));
