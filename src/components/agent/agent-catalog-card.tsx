"use client";

import { cn } from "@/lib/utils";
import type { AgentDefinition } from "@/constants/agent";
import { Check, Download, ExternalLink, Loader2 } from "lucide-react";

interface AgentCatalogCardProps {
  agent: AgentDefinition;
  available: boolean;
  /** 该 agent 是否已被添加到连接列表 */
  added: boolean;
  /** 是否正在连接中 */
  connecting?: boolean;
  onConnect: () => void;
  onInstall: () => void;
}

export function AgentCatalogCard({
  agent,
  available,
  added,
  connecting,
  onConnect,
  onInstall,
}: AgentCatalogCardProps) {
  const iconSrc = `/agent-img/${agent.icon}`;

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-4 transition-all hover:shadow-md",
        added && "border-green-500/30 bg-green-500/3",
      )}
    >
      <div className="flex items-center gap-3">
        {/* 图标 */}
        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          <img
            src={iconSrc}
            alt={agent.name}
            className="h-6 w-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{agent.name}</span>
            {available && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
            {agent.cli.join(" ")}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="shrink-0">
          {added ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />
              已添加
            </span>
          ) : connecting ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary opacity-60"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              连接中
            </button>
          ) : available ? (
            <button
              type="button"
              onClick={onConnect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              连接
            </button>
          ) : agent.npx ? (
            <button
              type="button"
              onClick={onInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              安装
            </button>
          ) : (
            <a
              href={agent.doc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              安装指南
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
