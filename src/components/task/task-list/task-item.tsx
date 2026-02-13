"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star, X } from "lucide-react";
import type { SessionMeta } from "@/types/session";
import type { TaskListGroupMode } from "@/types/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskItemProps {
  meta: SessionMeta;
  isActive: boolean;
  groupMode: TaskListGroupMode;
  onSwitch: () => void;
  onRemove: () => void;
  onToggleFavorite: () => void;
}

export function TaskItem({
  meta,
  isActive,
  groupMode,
  onSwitch,
  onRemove,
  onToggleFavorite,
}: TaskItemProps) {
  const [hovered, setHovered] = useState(false);

  const activeTimeStr = new Date(meta.lastActiveAt).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const createTimeStr = new Date(meta.createdAt).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getDetailContent = () => {
    const agentName = meta.agentName || "Unknown Agent";
    const workspaceName = meta.cwd.split("/").pop() || meta.cwd;

    switch (groupMode) {
      case "time":
      case "workspace":
        return (
          <>
            <span className="truncate" title={agentName}>
              {agentName}
            </span>
            <span className="shrink-0 opacity-50">|</span>
            <span className="shrink-0 font-mono text-[10px] opacity-70">
              {activeTimeStr}
            </span>
          </>
        );
      case "agent":
        return (
          <>
            <span className="truncate" title={workspaceName}>
              {workspaceName}
            </span>
            <span className="shrink-0 opacity-50">|</span>
            <span className="shrink-0 font-mono text-[10px] opacity-70">
              {activeTimeStr}
            </span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 w-full px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            onClick={onSwitch}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* 左侧文字区 */}
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium text-sm text-foreground/90">
                {meta.title ?? meta.sessionId.slice(0, 12) + "..."}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground/80">
                {getDetailContent()}
              </div>
            </div>
            {/* 右侧操作按钮 */}
            <div
              className={cn(
                "flex items-center gap-0.5 shrink-0 transition-opacity",
                hovered ? "opacity-100" : "opacity-0",
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={cn(
                  "p-1 rounded hover:bg-background/50 transition-colors",
                  meta.favorited
                    ? "text-amber-400 opacity-100"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={meta.favorited ? "取消收藏" : "收藏"}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5",
                    meta.favorited && "fill-amber-400",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-background/50 transition-colors"
                title="删除"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-[300px]">
          <div className="space-y-2">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">Agent:</span>
              <span>{meta.agentName || "Unknown"}</span>
              <span className="text-muted-foreground">工作目录:</span>
              <span className="font-mono break-all">{meta.cwd}</span>
              <span className="text-muted-foreground">创建时间:</span>
              <span className="font-mono">{createTimeStr}</span>
              <span className="text-muted-foreground">最后活动:</span>
              <span className="font-mono">{activeTimeStr}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
