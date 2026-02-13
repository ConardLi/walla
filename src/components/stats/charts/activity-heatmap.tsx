"use client";

import { useMemo } from "react";
import {
  format,
  subDays,
  eachDayOfInterval,
  getDay,
  startOfWeek,
  endOfWeek,
  differenceInCalendarDays,
  addDays,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  days?: number;
}

const LEVEL_COLORS = [
  "bg-secondary", // 0
  "bg-emerald-200 dark:bg-emerald-900/40", // 1-3
  "bg-emerald-300 dark:bg-emerald-800/60", // 4-6
  "bg-emerald-400 dark:bg-emerald-700/80", // 7-9
  "bg-emerald-500 dark:bg-emerald-600", // 10+
];

function getColor(count: number, max: number) {
  if (count === 0) return LEVEL_COLORS[0];
  if (max === 0) return LEVEL_COLORS[0];

  const ratio = count / max;
  if (ratio <= 0.25) return LEVEL_COLORS[1];
  if (ratio <= 0.5) return LEVEL_COLORS[2];
  if (ratio <= 0.75) return LEVEL_COLORS[3];
  return LEVEL_COLORS[4];
}

export function ActivityHeatmap({ data, days = 365 }: ActivityHeatmapProps) {
  const { weeks, maxCount } = useMemo(() => {
    const today = new Date();
    // 结束日期设为今天
    const end = today;
    // 开始日期设为 days 天前，并调整到该周的周日（让图表左对齐美观）
    const start = subDays(end, days);
    const alignedStart = startOfWeek(start);

    // 生成所有日期
    const allDates = eachDayOfInterval({ start: alignedStart, end });

    // 映射数据
    const dataMap = new Map(data.map((d) => [d.date, d.count]));
    let max = 0;

    const weeks: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];

    allDates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const count = dataMap.get(dateStr) || 0;
      if (count > max) max = count;

      currentWeek.push({ date, count });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // 处理不满一周的情况（最后一周）
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxCount: max };
  }, [data, days]);

  const monthLabels = useMemo(() => {
    // 简单的月份标签生成逻辑
    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, index) => {
      const firstDay = week[0].date;
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        labels.push({ index, label: format(firstDay, "MMM") });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="flex flex-col gap-2 overflow-x-auto pb-2">
      <div className="flex text-xs text-muted-foreground ml-8 relative h-4">
        {monthLabels.map((m) => (
          <span
            key={m.index}
            className="absolute"
            style={{ left: `${m.index * 14}px` }} // 10px box + 4px gap
          >
            {m.label}
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        {/* 星期标签 */}
        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pt-[14px] pr-2">
          <div className="h-[10px] leading-[10px]">Mon</div>
          <div className="h-[10px] leading-[10px] mt-[14px]">Wed</div>
          <div className="h-[10px] leading-[10px] mt-[14px]">Fri</div>
        </div>

        {/* 热力图网格 */}
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <TooltipProvider key={dayIndex}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-[10px] h-[10px] rounded-[2px] transition-colors hover:ring-1 hover:ring-ring/50",
                          getColor(day.count, maxCount),
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {format(day.date, "yyyy-MM-dd")}:{" "}
                      {day.count.toLocaleString()} Tokens
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-end mt-2 pr-4">
        <span>Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className={cn("w-[10px] h-[10px] rounded-[2px]", color)}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
