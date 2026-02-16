"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, Globe, Plus, AlertCircle } from "lucide-react";
import type { RecommendedMCPServer } from "@/constants/recommended-mcp-servers";

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
        className="h-10 w-10 rounded-lg object-contain"
      />
    );
  }

  // 使用首字母
  const firstLetter = server.name.charAt(0).toUpperCase();
  return (
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <span className="text-lg font-semibold text-primary">{firstLetter}</span>
    </div>
  );
}

export function RecommendedServerCard({
  server,
  onAdd,
  isAdded,
}: RecommendedServerCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="shrink-0">{getServerIcon(server)}</div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{server.name}</h4>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              {server.transportType === "stdio" ? (
                <Terminal className="h-2.5 w-2.5 mr-1" />
              ) : (
                <Globe className="h-2.5 w-2.5 mr-1" />
              )}
              {server.transportType.toUpperCase()}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {server.description}
          </p>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {server.category}
            </Badge>
            {server.requiresUserInput && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600">
                <AlertCircle className="h-3 w-3" />
                需填写参数
              </span>
            )}
          </div>
        </div>

        {/* 添加按钮 */}
        <Button
          size="sm"
          variant={isAdded ? "secondary" : "default"}
          className="shrink-0"
          onClick={() => onAdd(server)}
          disabled={isAdded}
        >
          {isAdded ? (
            "已添加"
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 mr-1" />
              添加
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
