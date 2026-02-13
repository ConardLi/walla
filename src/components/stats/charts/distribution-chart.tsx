"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistributionChartProps {
  data: { name: string; value: number }[];
  title: string;
}

const COLORS = [
  "#10b981", // Emerald 500
  "#3b82f6", // Blue 500
  "#f59e0b", // Amber 500
  "#ef4444", // Red 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
  "#6366f1", // Indigo 500
  "#14b8a6", // Teal 500
];

export function DistributionChart({ data, title }: DistributionChartProps) {
  const chartData = useMemo(() => {
    // 过滤掉 value 为 0 的项，并取前 8 个，其他的归为 "Other"
    const validData = data.filter((d) => d.value > 0);
    if (validData.length <= 8) return validData;

    const top8 = validData.slice(0, 8);
    const other = validData
      .slice(8)
      .reduce((acc, cur) => acc + cur.value, 0);
    
    return [...top8, { name: "Other", value: other }];
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="var(--background)"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "var(--foreground)" }}
              formatter={(value: any) => [
                Number(value || 0).toLocaleString(),
                "Tokens",
              ]}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
