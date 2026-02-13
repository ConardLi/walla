import { useState, useEffect, useMemo } from "react";
import * as ipc from "@/services/ipc-client";
import type { TokenUsageRecord } from "@/types/token-usage";
import { startOfDay, format, subDays, eachDayOfInterval } from "date-fns";

export interface DailyStat {
  date: string;
  count: number;
}

export interface StatsData {
  totalTokens: number;
  totalInput: number;
  totalOutput: number;
  totalSessions: number;
  dailyStats: DailyStat[];
  agentStats: { name: string; value: number }[];
  modelStats: { name: string; value: number }[];
  recentRecords: TokenUsageRecord[];
  allRecords: TokenUsageRecord[];
}

export function useTokenStats() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsData>({
    totalTokens: 0,
    totalInput: 0,
    totalOutput: 0,
    totalSessions: 0,
    dailyStats: [],
    agentStats: [],
    modelStats: [],
    recentRecords: [],
    allRecords: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await ipc.storageGetAll({ namespace: "token_usage" });
      const rawData = result.data;

      const allRecords: TokenUsageRecord[] = [];
      const sessions = new Set<string>();

      // 1. 提取所有记录
      Object.entries(rawData).forEach(([key, value]) => {
        if (key.startsWith("records:")) {
          const records = value as TokenUsageRecord[];
          if (Array.isArray(records)) {
            allRecords.push(...records);
            records.forEach((r) => sessions.add(r.sessionId));
          }
        }
      });

      // 2. 聚合统计
      let totalTokens = 0;
      let totalInput = 0;
      let totalOutput = 0;
      const dailyMap = new Map<string, number>();
      const agentMap = new Map<string, number>();
      const modelMap = new Map<string, number>();

      allRecords.forEach((record) => {
        const usage = record.usage;
        const total = usage.totalTokens || 0;

        totalTokens += total;
        totalInput += usage.inputTokens || 0;
        totalOutput += usage.outputTokens || 0;

        // 按天聚合 (yyyy-MM-dd)
        const dateKey = format(new Date(record.timestamp), "yyyy-MM-dd");
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + total);

        // 按 Agent 聚合
        const agentName = record.agentName || "Unknown";
        agentMap.set(agentName, (agentMap.get(agentName) || 0) + total);

        // 按 Model 聚合
        const modelName = record.modelId || "Unknown";
        modelMap.set(modelName, (modelMap.get(modelName) || 0) + total);
      });

      // 3. 补全最近 365 天的数据（用于热力图）
      // 或者只补全有数据的区间？通常热力图需要连续日期
      // 这里先不做全量补全，由组件处理，但为了趋势图，可以补全最近 30 天
      const today = new Date();
      const last30Days = eachDayOfInterval({
        start: subDays(today, 29),
        end: today,
      }).map((date) => format(date, "yyyy-MM-dd"));

      // 4. 格式化输出
      const dailyStats = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const agentStats = Array.from(agentMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const modelStats = Array.from(modelMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // 最近记录
      const recentRecords = allRecords
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);

      setData({
        totalTokens,
        totalInput,
        totalOutput,
        totalSessions: sessions.size,
        dailyStats,
        agentStats,
        modelStats,
        recentRecords,
        allRecords,
      });
    } catch (err) {
      console.error("Failed to load token stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, refresh: loadData };
}
