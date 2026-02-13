"use client";

import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Server,
} from "lucide-react";
import type { BootPhase } from "@/types/nav";
import type { AgentConnection } from "@/types/agent";
import { useAgentStore } from "@/stores/agent-store";
import { AGENTS } from "@/constants/agent";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { LoadingShimmer } from "@/components/ui/loading-shimmer";

export function BootScreen({
  phase,
  connectingAgents,
}: {
  phase: BootPhase;
  connectingAgents: AgentConnection[];
}) {
  const isGrid = connectingAgents.length > 4;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* 注入动画样式 - 仅保留 AgentConnectionRow 需要的 shimmer */}
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* 背景装饰：极简的柔光 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div
        className={cn(
          "z-10 w-full flex flex-col items-center gap-12 px-6 animate-in fade-in zoom-in-95 duration-700",
          isGrid ? "max-w-4xl" : "max-w-md",
        )}
      >
        {/* 文字流光 Loading */}
        <div className="relative flex items-center justify-center h-24">
          <LoadingShimmer />
        </div>

        {/* Agent 列表 */}
        {phase === "connecting" && connectingAgents.length > 0 && (
          <div className="w-full">
            <div
              className={cn(
                "grid gap-3 w-full",
                isGrid ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
              )}
            >
              {connectingAgents.map((agent, index) => (
                <AgentConnectionRow
                  key={agent.id}
                  agent={agent}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* 底部状态提示 - 极简 */}
        <div className="text-center space-y-1 animate-in slide-in-from-bottom-2 fade-in duration-700 delay-300">
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-[0.2em]">
            {phase === "loading" && "INITIALIZING"}
            {phase === "connecting" && "CONNECTING"}
            {/* {phase === "no-agent" && "FAILED"} */}
          </p>
        </div>
      </div>
    </div>
  );
}

function AgentConnectionRow({
  agent,
  index,
}: {
  agent: AgentConnection;
  index: number;
}) {
  const runtimeState = useAgentStore((s) => s.runtimeStates[agent.id]);
  const status = runtimeState?.status || "disconnected";
  const error = runtimeState?.error;

  const isConnecting = status === "connecting" || status === "initializing";
  const isReady = status === "ready" || status === "connected";
  const isError = status === "error";

  const agentDef = AGENTS.find(
    (a) => a.name.toLowerCase() === agent.name.toLowerCase(),
  );
  const icon = agentDef?.icon;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden transition-all duration-500",
        isReady &&
          "border-green-500/30 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
        isError && "border-destructive/30 bg-destructive/5",
        !isReady && !isError && "border-white/10 shadow-lg",
      )}
      style={{
        animationDelay: `${index * 150}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Shimmer 闪光效果 - 仅在连接中显示 */}
      {isConnecting && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent z-0" />
      )}

      {/* 进度条背景 - 仅在连接中显示 */}
      {isConnecting && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-primary/50 animate-[shimmer_2s_infinite] w-full origin-left" />
      )}

      {/* 图标区域 */}
      <div className="relative z-10 h-12 w-12 shrink-0 rounded-xl bg-background/50 border border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
        {icon ? (
          <img
            src={`/agent-img/${icon}`}
            alt={agent.name}
            className={cn(
              "h-7 w-7 object-contain transition-transform duration-500",
              isConnecting && "scale-110 animate-pulse",
              isReady && "scale-100",
            )}
          />
        ) : (
          <Server className="h-6 w-6 text-muted-foreground" />
        )}

        {/* 状态指示器 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none" />
      </div>

      {/* 信息区域 */}
      <div className="flex-1 min-w-0 z-10 flex flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              "font-semibold text-sm tracking-wide transition-colors duration-300",
              isReady ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {agent.name}
          </h3>

          {/* 极简状态图标 */}
          <div className="shrink-0">
            {isConnecting && (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            )}
            {isReady && (
              <CheckCircle2 className="h-4 w-4 text-green-500 animate-in zoom-in duration-300" />
            )}
            {isError && (
              <XCircle className="h-4 w-4 text-destructive animate-in zoom-in duration-300" />
            )}
          </div>
        </div>

        {/* 状态描述 */}
        <div className="text-xs truncate h-4 flex items-center">
          {isError ? (
            <span className="text-destructive/90 font-medium">
              {error || "Connection Failed"}
            </span>
          ) : isReady ? (
            <span className="text-green-600/70 dark:text-green-400/70 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              System Online
            </span>
          ) : (
            <span className="text-muted-foreground/50 font-mono text-[10px] tracking-wider animate-pulse">
              INITIALIZING...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
