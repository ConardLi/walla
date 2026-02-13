"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAgentStore, selectStatus } from "@/stores/agent-store";
import type { AgentConnection } from "@/types/agent";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavStore } from "@/stores/nav-store";
import { Bot, ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAgentIconByName } from "@/lib/agent-icon";

interface AgentSelectorProps {
  disabled?: boolean;
}

export function AgentSelector({ disabled }: AgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const connections = useAgentStore((s) => s.connections);
  const activeConnectionId = useAgentStore((s) => s.activeConnectionId);
  const runtimeStates = useAgentStore((s) => s.runtimeStates);
  const connectAgent = useAgentStore((s) => s.connectAgent);
  const setActiveConnection = useAgentStore((s) => s.setActiveConnection);
  const activeStatus = useAgentStore(selectStatus);
  const setActivePage = useNavStore((s) => s.setActivePage);
  const createSession = useSessionStore((s) => s.createSession);
  const directories = useWorkspaceStore((s) => s.directories);

  const activeConn = connections.find((c) => c.id === activeConnectionId);

  // 排序：已连接的排在前面，其次是默认的
  const sortedConnections = [...connections].sort((a, b) => {
    const isReadyA = runtimeStates[a.id]?.status === "ready";
    const isReadyB = runtimeStates[b.id]?.status === "ready";

    // 1. 已连接优先
    if (isReadyA !== isReadyB) {
      return isReadyA ? -1 : 1;
    }

    // 2. 默认优先
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }

    return 0;
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = async (conn: AgentConnection) => {
    if (conn.id === activeConnectionId) {
      setOpen(false);
      return;
    }

    setOpen(false);
    setSwitching(true);

    try {
      const rt = runtimeStates[conn.id];
      if (rt?.status === "ready") {
        // 已连接：直接切换 + 创建新 Session
        setActiveConnection(conn.id);
        const defaultCwd = directories[0] || "/tmp";
        await createSession(defaultCwd, { persist: false });
      } else {
        // 未连接：先切换 active，再连接
        setActiveConnection(conn.id);
        await connectAgent(conn.id);
        // 连接成功后创建 Session
        const finalRt = useAgentStore.getState().runtimeStates[conn.id];
        if (finalRt?.status === "ready") {
          const defaultCwd = directories[0] || "/tmp";
          await createSession(defaultCwd, { persist: false });
        } else {
          const errMsg = finalRt?.error || "连接失败";
          toast.error(`${conn.name} 连接失败`, { description: errMsg });
        }
      }
    } catch (err) {
      toast.error(`${conn.name} 连接失败`, {
        description: (err as Error).message,
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleGoToAgent = () => {
    setOpen(false);
    setActivePage("agent");
  };

  const displayLabel = activeConn?.name ?? "未选择 Agent";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex",
        (disabled || switching) && "opacity-50 pointer-events-none",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-base transition-all",
          "bg-muted/60 hover:bg-muted text-foreground hover:text-foreground",
          "font-medium",
        )}
      >
        {(() => {
          const icon = activeConn ? getAgentIconByName(activeConn.name) : null;
          return icon ? (
            <img
              src={icon}
              alt=""
              className="h-5 w-5 object-contain shrink-0"
            />
          ) : (
            <Bot className="h-5 w-5" />
          );
        })()}
        <span className="max-w-[180px] truncate">{displayLabel}</span>
        {switching ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : activeStatus === "ready" ? (
          <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
        ) : null}
        <ChevronDown className="h-5 w-5 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[240px] rounded-lg border bg-popover shadow-lg z-50">
          <div className="max-h-64 overflow-auto py-1">
            {connections.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                暂无 Agent 配置
              </div>
            ) : (
              sortedConnections.map((conn) => {
                const isActive = conn.id === activeConnectionId;
                const rt = runtimeStates[conn.id];
                const connStatus = rt?.status ?? "disconnected";
                const isReady = connStatus === "ready";
                const isConnecting =
                  connStatus === "connecting" || connStatus === "initializing";

                return (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => handleSelect(conn)}
                    disabled={isConnecting}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      isConnecting && "opacity-50",
                    )}
                  >
                    {(() => {
                      const icon = getAgentIconByName(conn.name);
                      return icon ? (
                        <img
                          src={icon}
                          alt=""
                          className="h-4 w-4 object-contain shrink-0"
                        />
                      ) : (
                        <Bot className="h-4 w-4 shrink-0" />
                      );
                    })()}
                    <span className="flex-1 truncate">{conn.name}</span>
                    {/* 连接状态指示 */}
                    {isConnecting && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-yellow-500" />
                    )}
                    {isReady && (
                      <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    )}
                    {connStatus === "error" && (
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    )}
                    {conn.isDefault && (
                      <span className="text-[10px] opacity-50">默认</span>
                    )}
                    {isActive && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t">
            <button
              type="button"
              onClick={handleGoToAgent}
              className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>管理 Agent...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
