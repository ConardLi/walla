"use client";

import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import type { RecommendedMCPServer } from "@/constants/recommended-mcp-servers";
import { cn } from "@/lib/utils";

interface RecommendedServerCardProps {
  server: RecommendedMCPServer;
  onAdd: (server: RecommendedMCPServer) => void;
  isAdded?: boolean;
}

/**
 * 获取服务器图标或首字母
 */
function getServerIcon(server: RecommendedMCPServer) {
  if (server.icon) {
    return (
      <img
        src={server.icon}
        alt={server.name}
        className="h-10 w-10 rounded-lg object-contain bg-muted/50 p-1"
      />
    );
  }

  // 使用首字母
  const firstLetter = server.name.charAt(0).toUpperCase();
  return (
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
      <span className="text-lg font-semibold">{firstLetter}</span>
    </div>
  );
}

export function RecommendedServerCard({
  server,
  onAdd,
  isAdded,
}: RecommendedServerCardProps) {
  return (
    <div
      className={cn(
        "group border rounded-xl bg-chat-background p-3 transition-all duration-200 hover:shadow-sm flex items-center gap-3",
        isAdded && "bg-muted/30 opacity-80",
      )}
    >
      {/* 图标 */}
      <div className="shrink-0">{getServerIcon(server)}</div>

      {/* 中间信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-medium truncate">{server.name}</h4>
          {server.requiresUserInput ? (
            <span className="shrink-0 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full border border-amber-100 dark:border-amber-900">
              需配置
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-green-600 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded-full border border-green-100 dark:border-green-900">
              开箱即用
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {server.description}
        </p>
      </div>

      {/* 右侧操作 */}
      <Button
        size="sm"
        variant={isAdded ? "secondary" : "default"}
        className={cn(
          "shrink-0 h-7 text-xs px-3 shadow-none",
          isAdded
            ? "bg-muted text-muted-foreground hover:bg-muted"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        onClick={() => onAdd(server)}
        disabled={isAdded}
      >
        {isAdded ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            已添加
          </>
        ) : (
          <>
            <Plus className="h-3 w-3 mr-1" />
            添加
          </>
        )}
      </Button>
    </div>
  );
}
