"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, MessageSquare, ArrowUp, ArrowDown } from "lucide-react";

interface OverviewCardsProps {
  totalTokens: number;
  totalInput: number;
  totalOutput: number;
  totalSessions: number;
}

export function OverviewCards({
  totalTokens,
  totalInput,
  totalOutput,
  totalSessions,
}: OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总 Token 消耗</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            历史累计消耗
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">输入 Tokens</CardTitle>
          <ArrowUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInput.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            占比 {((totalInput / (totalTokens || 1)) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">输出 Tokens</CardTitle>
          <ArrowDown className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOutput.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            占比 {((totalOutput / (totalTokens || 1)) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总会话数</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSessions}</div>
          <p className="text-xs text-muted-foreground">
            平均 {Math.round(totalTokens / (totalSessions || 1)).toLocaleString()} / 会话
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
