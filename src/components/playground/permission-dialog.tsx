"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, X, Check, CheckCheck, Ban, ListPlus } from "lucide-react";
import { usePermissionQueue } from "@/services/event-listener";
import { usePermissionStore } from "@/stores/permission-store";
import { extractWhitelistInfo } from "./permission-utils";

const OPTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  allow_once: {
    label: "允许一次",
    icon: <Check className="h-3.5 w-3.5" />,
    colorClass:
      "text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700",
  },
  allow_always: {
    label: "始终允许",
    icon: <CheckCheck className="h-3.5 w-3.5" />,
    colorClass:
      "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700",
  },
  reject_once: {
    label: "拒绝",
    icon: <Ban className="h-3.5 w-3.5" />,
    colorClass:
      "text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700",
  },
};

export function PermissionDialog() {
  const queue = usePermissionQueue((s) => s.queue);
  const respond = usePermissionQueue((s) => s.respond);
  const respondAndBatch = usePermissionQueue((s) => s.respondAndBatch);
  const addToolToWhitelist = usePermissionStore((s) => s.addToolToWhitelist);
  const addCommandToWhitelist = usePermissionStore(
    (s) => s.addCommandToWhitelist,
  );

  // 直接取队列首项，不再用独立 state 管理 current
  // 这样 respondAndBatch 从 queue 移除后组件自动重渲染，不会残留弹窗
  const current = queue[0] ?? null;

  if (!current) return null;

  const toolInput = current.toolCall?.rawInput;
  const whitelistInfo = extractWhitelistInfo(current);
  const pendingCount = queue.length;

  const handleSelect = async (optionId: string, optionKind: string) => {
    // allow_always / reject_once → 批量响应同类请求
    if (optionKind === "allow_always" || optionKind === "reject_once") {
      await respondAndBatch(current.requestId, optionId, optionKind);
    } else {
      await respond(current.requestId, optionId);
    }
  };

  // 取消/拒绝 → 优先用 reject_once，其次任何 reject 类选项，避免 cancelled 停止任务
  const handleCancel = async () => {
    const rejectOpt =
      current.options.find((o) => o.kind === "reject_once") ??
      current.options.find((o) => o.kind.startsWith("reject"));
    if (rejectOpt) {
      await respondAndBatch(
        current.requestId,
        rejectOpt.optionId,
        rejectOpt.kind,
      );
    } else {
      // 实在没有 reject 选项，用 selected + 最后一个选项（通常是拒绝类）
      const lastOpt = current.options[current.options.length - 1];
      if (lastOpt) {
        await respond(current.requestId, lastOpt.optionId);
      } else {
        await respond(current.requestId, null);
      }
    }
  };

  // 加入白名单并允许
  const handleAddToWhitelist = async () => {
    if (whitelistInfo) {
      if (whitelistInfo.type === "command") {
        await addCommandToWhitelist(whitelistInfo.value);
      } else {
        await addToolToWhitelist(whitelistInfo.value);
      }
    }
    const allowOpt = current.options.find((o) => o.kind === "allow_once");
    if (allowOpt) {
      await respond(current.requestId, allowOpt.optionId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              权限请求
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">操作：</span>
              <span className="font-medium">{current.toolCall.title}</span>
            </div>
            {current.toolCall.kind && (
              <Badge variant="outline">{current.toolCall.kind}</Badge>
            )}

            {toolInput != null && (
              <div className="mt-2 text-xs">
                <span className="text-muted-foreground block mb-1">
                  参数详情：
                </span>
                <pre className="bg-muted p-2 rounded-md overflow-auto max-h-[150px] whitespace-pre-wrap break-all font-mono">
                  {typeof toolInput === "string"
                    ? toolInput
                    : JSON.stringify(toolInput, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {pendingCount > 1 && (
            <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
              队列中还有 <span className="font-medium">{pendingCount - 1}</span>{" "}
              个待处理请求
              <span className="opacity-60">
                （选择「始终允许」或「拒绝」会自动批量处理同类请求）
              </span>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">
              选择一个选项：
            </span>
            <div className="space-y-2">
              {current.options.map((opt) => {
                const config = OPTION_CONFIG[opt.kind];
                return (
                  <Button
                    key={opt.optionId}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-9 transition-colors",
                      config ? config.colorClass : "hover:bg-accent",
                    )}
                    onClick={() => handleSelect(opt.optionId, opt.kind)}
                  >
                    {config ? (
                      <>
                        <span className="mr-2">{config.icon}</span>
                        <span>{config.label}</span>
                        <span className="ml-auto text-[10px] opacity-60 font-mono">
                          {opt.kind}
                        </span>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="mr-2 text-[10px]">
                          {opt.kind}
                        </Badge>
                        {opt.name}
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {whitelistInfo && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-9 text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 transition-colors"
              onClick={handleAddToWhitelist}
            >
              <ListPlus className="h-3.5 w-3.5 mr-2" />
              <span>加入白名单并允许</span>
              <span className="ml-auto text-[10px] opacity-60 font-mono truncate max-w-[150px]">
                {whitelistInfo.value}
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleCancel}
          >
            取消
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
