"use client";

import { type AgentConnection, type AgentRuntimeState } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Plug,
  PlugZap,
  Trash2,
  Star,
  StarOff,
  Pencil,
  Loader2,
  Info,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgentIconByName } from "@/lib/agent-icon";

interface AgentCardProps {
  conn: AgentConnection;
  isActive: boolean;
  runtimeState?: AgentRuntimeState;
  onConnect: () => void;
  onDisconnect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onViewDetail: () => void;
}

export function AgentCard({
  conn,
  isActive,
  runtimeState,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onSetDefault,
  onViewDetail,
}: AgentCardProps) {
  const status = runtimeState?.status ?? "disconnected";
  const isConnecting = status === "connecting" || status === "initializing";
  const isReady = status === "ready";
  const isConnected = isReady || isConnecting;
  const iconSrc = getAgentIconByName(conn.name);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md",
        isReady && "border-green-500/30 bg-green-500/5",
        isConnecting && "border-yellow-500/30 bg-yellow-500/5",
        status === "error" && "border-destructive/30 bg-destructive/5",
      )}
    >
      {/* 左侧状态图标 */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm",
          isReady
            ? "bg-green-500/10 border-green-500/20 text-green-500"
            : isConnecting
              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
              : status === "error"
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-background border-border text-muted-foreground",
        )}
      >
        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : iconSrc ? (
          <img
            src={iconSrc}
            alt={conn.name}
            className="h-5 w-5 object-contain"
          />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>

      {/* 中间信息 */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate text-foreground">
            {conn.name}
          </span>
          {conn.isDefault && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 shrink-0 h-4 font-normal"
            >
              默认
            </Badge>
          )}
          {isReady && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-green-600 border-green-500/30 bg-green-500/10 shrink-0 h-4 font-normal"
            >
              已连接
            </Badge>
          )}
          {isConnecting && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-yellow-600 border-yellow-500/30 bg-yellow-500/10 shrink-0 h-4 font-normal"
            >
              {status === "connecting" ? "连接中" : "初始化中"}
            </Badge>
          )}
          {status === "error" && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-destructive border-destructive/30 bg-destructive/10 shrink-0 h-4 font-normal"
            >
              错误
            </Badge>
          )}
        </div>

        {/* 命令摘要 */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <Terminal className="h-3 w-3 shrink-0" />
          <code className="font-mono truncate leading-none">
            {conn.command} {conn.args?.join(" ")}
          </code>
        </div>
      </div>

      {/* 右侧操作按钮 */}
      <div className="flex items-center gap-2 pl-2 border-l border-border/50">
        {/* 悬浮显示的辅助按钮 */}
        <div className="hidden group-hover:flex items-center gap-0.5 animate-in fade-in slide-in-from-right-1 duration-200">
          <IconButton
            onClick={onViewDetail}
            title="查看详情"
            icon={<Info className="h-3.5 w-3.5" />}
          />
          <IconButton
            onClick={onSetDefault}
            title={conn.isDefault ? "取消默认" : "设为默认"}
            icon={
              conn.isDefault ? (
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-3.5 w-3.5" />
              )
            }
          />
          <IconButton
            onClick={onEdit}
            title="编辑"
            icon={<Pencil className="h-3.5 w-3.5" />}
          />
          <IconButton
            onClick={onDelete}
            title="删除"
            disabled={isConnected}
            className="hover:text-destructive hover:bg-destructive/10"
            icon={<Trash2 className="h-3.5 w-3.5" />}
          />
        </div>

        {/* 连接/断开按钮 */}
        {isConnected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md border bg-background text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors shadow-sm whitespace-nowrap"
          >
            <PlugZap className="h-3.5 w-3.5" />
            断开
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
          >
            {isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plug className="h-3.5 w-3.5" />
            )}
            连接
          </button>
        )}
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  title,
  icon,
  disabled,
  className,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none",
        className,
      )}
    >
      {icon}
    </button>
  );
}
