"use client";

/**
 * 聊天区域骨架屏 — loadSession 期间展示
 */
export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200">
      {/* 消息区域骨架 */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 py-4 space-y-4">
          {/* 用户消息骨架 */}
          <div className="flex justify-end">
            <div className="w-[55%] space-y-2">
              <div className="h-3 bg-muted/60 rounded-full animate-pulse" />
              <div className="h-3 bg-muted/40 rounded-full w-[75%] ml-auto animate-pulse" />
            </div>
          </div>

          {/* Agent 消息骨架 */}
          <div className="space-y-2">
            <div className="h-3 bg-muted/60 rounded-full w-[80%] animate-pulse" />
            <div className="h-3 bg-muted/40 rounded-full w-[65%] animate-pulse" />
            <div className="h-3 bg-muted/30 rounded-full w-[45%] animate-pulse" />
          </div>

          {/* 工具调用骨架 */}
          <div className="ml-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/30">
              <div className="h-3.5 w-3.5 rounded bg-muted/50 animate-pulse" />
              <div className="h-3 bg-muted/50 rounded-full w-[40%] animate-pulse" />
              <div className="flex-1" />
              <div className="h-3.5 w-3.5 rounded-full bg-muted/40 animate-pulse" />
            </div>
          </div>

          {/* Agent 消息骨架 */}
          <div className="space-y-2">
            <div className="h-3 bg-muted/50 rounded-full w-[70%] animate-pulse" />
            <div className="h-3 bg-muted/30 rounded-full w-[55%] animate-pulse" />
          </div>

          {/* 用户消息骨架 */}
          <div className="flex justify-end">
            <div className="w-[40%] space-y-2">
              <div className="h-3 bg-muted/50 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Agent 消息骨架 */}
          <div className="space-y-2">
            <div className="h-3 bg-muted/40 rounded-full w-[85%] animate-pulse" />
            <div className="h-3 bg-muted/30 rounded-full w-[60%] animate-pulse" />
            <div className="h-3 bg-muted/20 rounded-full w-[35%] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 底部输入框骨架 */}
      <div className="p-3">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border bg-background/50 shadow-sm px-4 py-3 space-y-2">
            <div className="h-4 bg-muted/30 rounded w-[30%] animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-muted/20 rounded-md animate-pulse" />
                <div className="h-6 w-20 bg-muted/20 rounded-md animate-pulse" />
              </div>
              <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
