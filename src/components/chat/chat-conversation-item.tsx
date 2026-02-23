"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star, X } from "lucide-react";
import type { ChatConversation } from "@/types/chat";
import type {
  ChatConvGroupMode,
  ChatConvSortMode,
  ChatConvViewMode,
} from "@/stores/chat-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatConversationItemProps {
  conv: ChatConversation;
  isActive: boolean;
  groupMode: ChatConvGroupMode;
  sortMode: ChatConvSortMode;
  viewMode: ChatConvViewMode;
  onSwitch: () => void;
  onRemove: () => void;
  onToggleFavorite: () => void;
}

export function ChatConversationItem({
  conv,
  isActive,
  groupMode,
  sortMode,
  viewMode,
  onSwitch,
  onRemove,
  onToggleFavorite,
}: ChatConversationItemProps) {
  const [hovered, setHovered] = useState(false);

  const updatedStr = new Date(conv.updatedAt).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const createdStr = new Date(conv.createdAt).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeStr = sortMode === "created" ? createdStr : updatedStr;

  const getDetailContent = () => {
    switch (groupMode) {
      case "time":
        return (
          <>
            <span className="truncate" title={conv.modelId || "未知模型"}>
              {conv.modelId || "未知模型"}
            </span>
            <span className="shrink-0 opacity-50">|</span>
            <span className="shrink-0 font-mono text-[10px] opacity-70">
              {timeStr}
            </span>
          </>
        );
      case "model":
        return (
          <span className="shrink-0 font-mono text-[10px] opacity-70">
            {timeStr}
          </span>
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
              "flex items-center gap-1 w-full px-2 py-1 rounded-md text-sm transition-colors cursor-pointer",
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
              <div className="truncate text-sm text-foreground">
                {conv.title || "新对话"}
              </div>
              {viewMode === "normal" && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground/80">
                  {getDetailContent()}
                </div>
              )}
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
                  conv.favorited
                    ? "text-amber-400 opacity-100"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={conv.favorited ? "取消收藏" : "收藏"}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5",
                    conv.favorited && "fill-amber-400",
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
              <span className="text-muted-foreground">模型:</span>
              <span>{conv.modelId || "未知模型"}</span>
              <span className="text-muted-foreground">创建时间:</span>
              <span className="font-mono">{createdStr}</span>
              <span className="text-muted-foreground">最后更新:</span>
              <span className="font-mono">{updatedStr}</span>
              <span className="text-muted-foreground">消息数:</span>
              <span>{conv.messages.length}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
