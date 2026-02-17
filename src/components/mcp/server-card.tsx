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
  Wrench,
  MessageSquare,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useMCPStore, selectMCPRuntime } from "@/stores/mcp-store";
import type { MCPServerConfig, MCPServerStatus } from "@/types/mcp";
import { ServerDetail } from "./server-detail";
import { cn } from "@/lib/utils";

const statusConfig: Record<MCPServerStatus, { label: string; color: string }> =
  {
    disconnected: {
      label: "未测试",
      color: "text-muted-foreground",
    },
    connecting: {
      label: "测试中",
      color: "text-blue-600 dark:text-blue-400",
    },
    connected: {
      label: "连接正常",
      color: "text-green-600 dark:text-green-400",
    },
    error: {
      label: "连接失败",
      color: "text-destructive",
    },
  };

function getServerIcon(icon?: string | null, name?: string) {
  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        className="h-10 w-10 rounded-lg object-contain bg-muted/50 p-1"
      />
    );
  }

  const firstLetter = name?.charAt(0).toUpperCase() ?? "S";
  return (
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
      <span className="text-lg font-semibold">{firstLetter}</span>
    </div>
  );
}

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
  const hasContent = toolCount > 0 || promptCount > 0 || resourceCount > 0;

  return (
    <div
      className={cn(
        "group border rounded-xl bg-card transition-all duration-200 hover:shadow-sm",
        expanded && "ring-1 ring-primary/20 shadow-sm",
      )}
    >
      <div className="p-4 relative">
        <div className="flex items-start gap-4">
          {/* 图标区域 */}
          <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {isConnecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              getServerIcon(server.icon, server.name)
            )}
          </div>

          {/* 主要内容 */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-medium text-sm truncate">{server.name}</h3>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
              >
                {server.transportType === "stdio" ? (
                  <Terminal className="h-3 w-3 mr-1" />
                ) : (
                  <Globe className="h-3 w-3 mr-1" />
                )}
                {server.transportType.toUpperCase()}
              </Badge>
              {runtime.status !== "disconnected" && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    sc.color,
                    "bg-muted/50",
                  )}
                >
                  {sc.label}
                </span>
              )}
            </div>

            {server.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {server.description}
              </p>
            )}

            {/* 统计信息 */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  toolCount > 0 && "text-foreground font-medium",
                )}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>{toolCount}</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  promptCount > 0 && "text-foreground font-medium",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{promptCount}</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  resourceCount > 0 && "text-foreground font-medium",
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{resourceCount}</span>
              </div>
            </div>

            {runtime.error && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive bg-destructive/5 p-2 rounded">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="break-all">{runtime.error}</span>
              </div>
            )}
          </div>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-blue-600"
              onClick={() =>
                isConnected
                  ? refreshServer(server.id)
                  : connectServer(server.id)
              }
              disabled={isConnecting}
              title={isConnected ? "重新测试" : "测试连接"}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isConnected ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Plug className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(server)}
              title="编辑配置"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeServer(server.id)}
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
              disabled={!hasContent}
              title={expanded ? "收起详情" : "查看详情"}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 展开详情 */}
      {expanded && displayRuntime && (
        <div className="px-4 pb-4 pt-0 border-t border-transparent animate-in slide-in-from-top-2 duration-200">
          <div className="pt-4 border-t border-dashed">
            <ServerDetail
              tools={displayRuntime.tools}
              prompts={displayRuntime.prompts}
              resources={displayRuntime.resources}
            />
          </div>
        </div>
      )}
    </div>
  );
}
