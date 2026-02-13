"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { TokenUsageRecord } from "@/types/token-usage";
import { useSessionStore } from "@/stores/session-store";

interface TopSessionsProps {
  records: TokenUsageRecord[];
}

export function TopSessions({ records }: TopSessionsProps) {
  // 聚合 Session 消耗
  const sessionStats = records.reduce(
    (acc, record) => {
      const { sessionId } = record;
      if (!acc[sessionId]) {
        acc[sessionId] = {
          sessionId,
          totalTokens: 0,
          agentName: record.agentName || "Unknown",
          modelName: record.modelName || record.modelId || "Unknown",
          lastActive: record.timestamp,
        };
      }
      acc[sessionId].totalTokens += record.usage.totalTokens || 0;
      // 更新最后活跃时间
      if (record.timestamp > acc[sessionId].lastActive) {
        acc[sessionId].lastActive = record.timestamp;
        // 尽可能用最新的 meta 信息
        if (record.agentName) acc[sessionId].agentName = record.agentName;
        if (record.modelName || record.modelId)
          acc[sessionId].modelName =
            record.modelName || record.modelId || "Unknown";
      }
      return acc;
    },
    {} as Record<
      string,
      {
        sessionId: string;
        totalTokens: number;
        agentName: string;
        modelName: string;
        lastActive: number;
      }
    >,
  );

  const sortedSessions = Object.values(sessionStats)
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 5);

  // 获取 session title (如果 store 里有)
  const sessionMetas = useSessionStore((s) => s.sessionMetas);

  const getSessionTitle = (id: string) => {
    const meta = sessionMetas.find((m) => m.sessionId === id);
    return meta?.title || id.slice(0, 8);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 5 消耗会话</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedSessions.map((session, i) => (
            <div key={session.sessionId} className="flex items-center">
              <div className="ml-4 space-y-1 flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {getSessionTitle(session.sessionId)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.agentName} · {session.modelName} ·{" "}
                  {format(session.lastActive, "MM-dd HH:mm")}
                </p>
              </div>
              <div className="font-mono font-medium text-sm">
                {session.totalTokens.toLocaleString()}
              </div>
            </div>
          ))}
          {sortedSessions.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              暂无数据
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
