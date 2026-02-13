"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, X } from "lucide-react";
import {
  useOperationConfirmQueue,
  type OperationConfirm,
} from "@/services/event-listener";

export function OperationConfirmDialog() {
  const queue = useOperationConfirmQueue((s) => s.queue);
  const respond = useOperationConfirmQueue((s) => s.respond);
  const [current, setCurrent] = useState<OperationConfirm | null>(null);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
    }
  }, [queue, current]);

  if (!current) return null;

  const handleApprove = async () => {
    await respond(current.confirmId, true);
    setCurrent(null);
  };

  const handleReject = async () => {
    await respond(current.confirmId, false);
    setCurrent(null);
  };

  const operationLabels: Record<string, string> = {
    readTextFile: "读取文件",
    writeTextFile: "写入文件",
    createTerminal: "执行命令",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              操作确认
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">操作类型：</span>
              <Badge variant="outline">
                {operationLabels[current.operation] ?? current.operation}
              </Badge>
            </div>
            <div className="text-sm font-medium">{current.description}</div>
          </div>

          {current.detail && Object.keys(current.detail).length > 0 && (
            <pre className="rounded-md border bg-muted/50 p-2 text-xs font-mono whitespace-pre-wrap break-all max-h-[150px] overflow-auto">
              {JSON.stringify(current.detail, null, 2)}
            </pre>
          )}

          {queue.length > 1 && (
            <p className="text-[10px] text-muted-foreground">
              还有 {queue.length - 1} 个操作等待确认
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={handleApprove}
            >
              批准
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleReject}
            >
              拒绝
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
