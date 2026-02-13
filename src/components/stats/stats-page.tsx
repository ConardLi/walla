"use client";

import { useState, useMemo } from "react";
import { useTokenStats } from "@/hooks/use-token-stats";
import { OverviewCards } from "./overview-cards";
import { ActivityHeatmap } from "./charts/activity-heatmap";
import { TrendChart } from "./charts/trend-chart";
import { DistributionChart } from "./charts/distribution-chart";
import { TopSessions } from "./top-sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatsFilter } from "./stats-filter";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

export function StatsPage() {
  const { data, loading, refresh } = useTokenStats();

  // State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("total"); // total, input, output

  // Extract unique options
  const { uniqueAgents, uniqueModels } = useMemo(() => {
    const agents = new Set<string>();
    const models = new Set<string>();

    data.allRecords.forEach((r) => {
      agents.add(r.agentName || "Unknown");
      models.add(r.modelId || "Unknown");
    });

    return {
      uniqueAgents: Array.from(agents).sort(),
      uniqueModels: Array.from(models).sort(),
    };
  }, [data.allRecords]);

  const filteredData = useMemo(() => {
    if (!data.allRecords.length)
      return {
        totalTokens: 0,
        totalInput: 0,
        totalOutput: 0,
        totalSessions: 0,
        dailyStats: [],
        agentStats: [],
        modelStats: [],
        recentRecords: [],
        allRecords: [],
        heatmapStats: [],
      };

    // Base records filtered by Agent and Model (used for Heatmap)
    let baseRecords = data.allRecords;

    if (selectedAgent !== "all") {
      baseRecords = baseRecords.filter(
        (r) => (r.agentName || "Unknown") === selectedAgent,
      );
    }

    if (selectedModel !== "all") {
      baseRecords = baseRecords.filter(
        (r) => (r.modelId || "Unknown") === selectedModel,
      );
    }

    // Heatmap Stats (Full time range, but filtered by Agent/Model)
    const heatmapMap = new Map<string, number>();
    baseRecords.forEach((record) => {
      const usage = record.usage;
      let val = 0;
      if (selectedMetric === "total") val = usage.totalTokens || 0;
      else if (selectedMetric === "input") val = usage.inputTokens || 0;
      else if (selectedMetric === "output") val = usage.outputTokens || 0;

      const dateKey = format(new Date(record.timestamp), "yyyy-MM-dd");
      heatmapMap.set(dateKey, (heatmapMap.get(dateKey) || 0) + val);
    });
    const heatmapStats = Array.from(heatmapMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Strict records filtered by Date Range (used for Overview, Trend, Distribution, TopSessions)
    let strictRecords = baseRecords;
    if (dateRange?.from) {
      const fromTime = startOfDay(dateRange.from).getTime();
      const toTime = dateRange.to
        ? endOfDay(dateRange.to).getTime()
        : endOfDay(dateRange.from).getTime();
      strictRecords = strictRecords.filter(
        (r) => r.timestamp >= fromTime && r.timestamp <= toTime,
      );
    }

    // Aggregation on strictRecords
    let totalTokens = 0;
    let totalInput = 0;
    let totalOutput = 0;
    const sessions = new Set<string>();
    const dailyMap = new Map<string, number>();
    const agentMap = new Map<string, number>();
    const modelMap = new Map<string, number>();

    strictRecords.forEach((record) => {
      const usage = record.usage;
      const t = usage.totalTokens || 0;
      const i = usage.inputTokens || 0;
      const o = usage.outputTokens || 0;

      totalTokens += t;
      totalInput += i;
      totalOutput += o;
      sessions.add(record.sessionId);

      // Metric for charts
      let metricValue = 0;
      if (selectedMetric === "total") metricValue = t;
      else if (selectedMetric === "input") metricValue = i;
      else if (selectedMetric === "output") metricValue = o;

      const dateKey = format(new Date(record.timestamp), "yyyy-MM-dd");
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + metricValue);

      const agentName = record.agentName || "Unknown";
      agentMap.set(agentName, (agentMap.get(agentName) || 0) + metricValue);

      const modelName = record.modelId || "Unknown";
      modelMap.set(modelName, (modelMap.get(modelName) || 0) + metricValue);
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const agentStats = Array.from(agentMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const modelStats = Array.from(modelMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Recent records
    const recentRecords = strictRecords
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    return {
      totalTokens,
      totalInput,
      totalOutput,
      totalSessions: sessions.size,
      dailyStats,
      agentStats,
      modelStats,
      recentRecords,
      allRecords: strictRecords,
      heatmapStats,
    };
  }, [data, dateRange, selectedAgent, selectedModel, selectedMetric]);

  const resetFilters = () => {
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
    setSelectedAgent("all");
    setSelectedModel("all");
    setSelectedMetric("total");
  };

  if (loading && data.totalTokens === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">加载统计数据...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/20 overflow-hidden">
      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 z-10 shrink-0 gap-3">
        <StatsFilter
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectedAgent={selectedAgent}
          setSelectedAgent={setSelectedAgent}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          uniqueAgents={uniqueAgents}
          uniqueModels={uniqueModels}
          onReset={resetFilters}
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            共 {filteredData.allRecords.length} 条记录
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={refresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto pb-20">
          {/* 核心指标卡片 */}
          <OverviewCards
            totalTokens={filteredData.totalTokens}
            totalInput={filteredData.totalInput}
            totalOutput={filteredData.totalOutput}
            totalSessions={filteredData.totalSessions}
          />

          {/* 活跃度热力图 (使用 heatmapStats) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                活跃度 (
                {selectedMetric === "total"
                  ? "总消耗"
                  : selectedMetric === "input"
                    ? "Input"
                    : "Output"}
                )
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap data={filteredData.heatmapStats} />
            </CardContent>
          </Card>

          {/* 趋势与分布 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* 左侧趋势图 (占 4 列) */}
            <div className="lg:col-span-4 h-[350px]">
              <TrendChart
                data={filteredData.dailyStats}
                title={`${selectedMetric === "total" ? "Token" : selectedMetric === "input" ? "Input" : "Output"} 消耗趋势`}
              />
            </div>

            {/* 右侧 Top Sessions (占 3 列) */}
            <div className="lg:col-span-3 h-[350px]">
              <TopSessions records={filteredData.recentRecords} />
            </div>
          </div>

          {/* 分布图 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-[350px]">
              <DistributionChart
                data={filteredData.agentStats}
                title="Agent 消耗占比"
              />
            </div>
            <div className="h-[350px]">
              <DistributionChart
                data={filteredData.modelStats}
                title="模型消耗占比"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
