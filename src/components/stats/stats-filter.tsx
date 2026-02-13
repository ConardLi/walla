"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "./date-picker-with-range";
import { DateRange } from "react-day-picker";

interface StatsFilterProps {
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
  selectedAgent: string;
  setSelectedAgent: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  selectedMetric: string;
  setSelectedMetric: (value: string) => void;
  uniqueAgents: string[];
  uniqueModels: string[];
  onReset: () => void;
}

export function StatsFilter({
  dateRange,
  setDateRange,
  selectedAgent,
  setSelectedAgent,
  selectedModel,
  setSelectedModel,
  selectedMetric,
  setSelectedMetric,
  uniqueAgents,
  uniqueModels,
  onReset,
}: StatsFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 日期选择 */}
      <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />

      {/* Agent 筛选 */}
      <Select value={selectedAgent} onValueChange={setSelectedAgent}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="所有 Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有 Agent</SelectItem>
          {uniqueAgents.map((agent) => (
            <SelectItem key={agent} value={agent}>
              {agent}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Model 筛选 */}
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="所有模型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有模型</SelectItem>
          {uniqueModels.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Metric 筛选 */}
      <Select value={selectedMetric} onValueChange={setSelectedMetric}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="统计指标" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="total">总 Tokens</SelectItem>
          <SelectItem value="input">Input Tokens</SelectItem>
          <SelectItem value="output">Output Tokens</SelectItem>
        </SelectContent>
      </Select>

      {(selectedAgent !== "all" ||
        selectedModel !== "all" ||
        selectedMetric !== "total") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" /> 重置
        </Button>
      )}
    </div>
  );
}
