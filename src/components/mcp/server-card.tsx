"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plug,
  PlugZap,
  Trash2,
  Pencil,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Terminal,
  Globe,
  Server,
} from "lucide-react";
import { useMCPStore, selectMCPRuntime } from "@/stores/mcp-store";
import type { MCPServerConfig, MCPServerStatus } from "@/types/mcp";
import { ServerDetail } from "./server-detail";

const statusConfig: Record<
  MCPServerStatus,
  { label: string; color: string; dotColor: string }
> = {
  disconnected: {
    label: "未连接",
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
  },
  connecting: {
    label: "连接中",
    color: "text-blue-500",
    dotColor: "bg-blue-500",
  },
  connected: {
    label: "已连接",
    color: "text-green-500",
    dotColor: "bg-green-500",
  },
  error: {
    label: "连接失败",
    color: "text-destructive",
    dotColor: "bg-destructive",
  },
};

interface ServerCardProps {
  server: MCPServerConfig;
  onEdit: (server: MCPServerConfig) => void;
}

export function ServerCard({ server, onEdit }: ServerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const runtime = useMCPStore((s) => selectMCPRuntime(s, server.id));
  const cachedRuntime = useMCPStore((s) => s.cachedRuntimes[server.id]);
  const connectServer = useMCPStore((s) => s.connectServer);
  const disconnectServer = useMCPStore((s) => s.disconnectServer);
  const removeServer = useMCPStore((s) => s.removeServer);
  const refreshServer = useMCPStore((s) => s.refreshServer);

  const sc = statusConfig[runtime.status];
  const isConnected = runtime.status === "connected";
  const isConnecting = runtime.status === "connecting";

  // 已连接时使用实时数据，未连接时使用缓存数据
  const displayRuntime = isConnected ? runtime : cachedRuntime;
  const toolCount = displayRuntime?.tools.length ?? 0;
  const promptCount = displayRuntime?.prompts.length ?? 0;
  const resourceCount = displayRuntime?.resources.length ?? 0;
  const hasCache = !!cachedRuntime;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 头部 */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-0.5 hover:bg-muted rounded transition-colors"
          disabled={!isConnected && !hasCache}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="shrink-0">
          <Server className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{server.name}</span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {server.transportType === "stdio" ? (
                <Terminal className="h-2.5 w-2.5 mr-1" />
              ) : (
                <Globe className="h-2.5 w-2.5 mr-1" />
              )}
              {server.transportType.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`flex items-center gap-1 text-xs ${sc.color}`}>
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dotColor} ${isConnecting ? "animate-pulse" : ""}`}
              />
              {sc.label}
            </span>
            {(toolCount > 0 || promptCount > 0 || resourceCount > 0) && (
              <span className="text-xs text-muted-foreground">
                {toolCount > 0 && `${toolCount} 工具`}
                {promptCount > 0 && ` · ${promptCount} 提示词`}
                {resourceCount > 0 && ` · ${resourceCount} 资源`}
              </span>
            )}
            {runtime.error && (
              <span className="text-xs text-destructive truncate">
                {runtime.error}
              </span>
            )}
          </div>
          {server.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {server.description}
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 shrink-0">
          {isConnected ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => refreshServer(server.id)}
                title="刷新"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => disconnectServer(server.id)}
                title="断开"
              >
                <PlugZap className="h-3.5 w-3.5 text-amber-500" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => connectServer(server.id)}
              disabled={isConnecting}
              title="连接"
            >
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plug className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(server)}
            title="编辑"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => removeServer(server.id)}
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {/* 展开详情 */}
      {expanded && displayRuntime && (
        <div className="px-4 pb-3 border-t pt-3">
          <ServerDetail
            tools={displayRuntime.tools}
            prompts={displayRuntime.prompts}
            resources={displayRuntime.resources}
          />
        </div>
      )}
    </div>
  );
}
