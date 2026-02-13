"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Blocks, Search, Check, Terminal, Globe } from "lucide-react";
import { useMCPStore } from "@/stores/mcp-store";
import type { MCPServerConfig } from "@/types/mcp";

interface McpSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function McpSelector({
  selectedIds,
  onChange,
  disabled,
}: McpSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const servers = useMCPStore((s) => s.servers);
  const loaded = useMCPStore((s) => s.loaded);
  const loadServers = useMCPStore((s) => s.loadServers);

  useEffect(() => {
    if (!loaded) loadServers();
  }, [loaded, loadServers]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // 打开时聚焦搜索
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = search
    ? servers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.description ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : servers;

  const toggleServer = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const count = selectedIds.length;

  if (servers.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen(!open);
        }}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
          count > 0
            ? "text-primary bg-primary/10 hover:bg-primary/15"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <Blocks className="h-3.5 w-3.5" />
        <span>MCP{count > 0 ? ` (${count})` : ""}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-72 rounded-lg border bg-popover shadow-lg z-50">
          {/* 搜索 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索 MCP Server..."
              className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* 列表 */}
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                {search ? "无匹配结果" : "暂无 MCP Server"}
              </div>
            ) : (
              filtered.map((server) => {
                const isSelected = selectedIds.includes(server.id);
                return (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => toggleServer(server.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                      isSelected
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {server.transportType === "stdio" ? (
                      <Terminal className="h-3 w-3 shrink-0" />
                    ) : (
                      <Globe className="h-3 w-3 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{server.name}</div>
                      {server.description && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {server.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3 w-3 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 将 MCP Store 的 MCPServerConfig 转换为 IPC 的 McpServerConfig
 */
export function toIpcMcpConfigs(
  selectedIds: string[],
  servers: MCPServerConfig[],
) {
  return servers
    .filter((s) => selectedIds.includes(s.id))
    .map((s) => {
      if (s.transportType === "sse") {
        return {
          type: "sse" as const,
          name: s.name,
          url: s.url ?? "",
        };
      }
      return {
        name: s.name,
        command: s.command ?? "",
        args: s.args ?? [],
        env: s.env
          ? Object.entries(s.env).map(([name, value]) => ({ name, value }))
          : undefined,
      };
    });
}
