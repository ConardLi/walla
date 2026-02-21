"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, X, Star, Clock, Bot, FolderOpen } from "lucide-react";
import type { SessionMeta } from "@/types/session";

type SearchDimension = "all" | "title" | "agent" | "workspace";

interface SessionSearchProps {
  open: boolean;
  onClose: () => void;
  sessionMetas: SessionMeta[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
}

const dimensions: Array<{
  id: SearchDimension;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "all", label: "全部", icon: <Search className="h-3 w-3" /> },
  { id: "title", label: "标题", icon: <Clock className="h-3 w-3" /> },
  { id: "agent", label: "Agent", icon: <Bot className="h-3 w-3" /> },
  { id: "workspace", label: "目录", icon: <FolderOpen className="h-3 w-3" /> },
];

function matchSession(
  meta: SessionMeta,
  query: string,
  dimension: SearchDimension,
): boolean {
  const q = query.toLowerCase();
  const title = (meta.title ?? meta.sessionId).toLowerCase();
  const agent = (meta.agentName ?? "").toLowerCase();
  const workspace = (meta.cwd.split("/").pop() ?? meta.cwd).toLowerCase();

  switch (dimension) {
    case "title":
      return title.includes(q);
    case "agent":
      return agent.includes(q);
    case "workspace":
      return workspace.includes(q);
    case "all":
    default:
      return title.includes(q) || agent.includes(q) || workspace.includes(q);
  }
}

function formatSearchTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionSearch({
  open,
  onClose,
  sessionMetas,
  activeSessionId,
  onSelect,
}: SessionSearchProps) {
  const [query, setQuery] = useState("");
  const [dimension, setDimension] = useState<SearchDimension>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 打开时聚焦输入框，关闭时重置
  useEffect(() => {
    if (open) {
      setQuery("");
      setDimension("all");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) {
      // 无搜索词时按最近活跃排序展示全部
      return [...sessionMetas].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
    }
    return sessionMetas
      .filter((m) => matchSession(m, query.trim(), dimension))
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  }, [sessionMetas, query, dimension]);

  // 选中项变化时滚动到可见区域
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (sessionId: string) => {
      onSelect(sessionId);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].sessionId);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      case "Tab":
        e.preventDefault();
        // Tab 切换搜索维度
        setDimension((d) => {
          const idx = dimensions.findIndex((dim) => dim.id === d);
          return dimensions[(idx + 1) % dimensions.length].id;
        });
        setSelectedIndex(0);
        break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 搜索面板 */}
      <div className="relative w-[480px] max-h-[60vh] bg-popover border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* 搜索输入 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索任务…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 维度切换 */}
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-muted/30">
          {dimensions.map((dim) => (
            <button
              key={dim.id}
              type="button"
              onClick={() => {
                setDimension(dim.id);
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                dimension === dim.id
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {dim.icon}
              {dim.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground/60">
            Tab 切换
          </span>
        </div>

        {/* 搜索结果 */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              无匹配结果
            </div>
          ) : (
            results.map((meta, idx) => (
              <button
                key={meta.sessionId}
                type="button"
                onClick={() => handleSelect(meta.sessionId)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                  idx === selectedIndex
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50",
                  activeSessionId === meta.sessionId &&
                    "border-l-2 border-primary",
                )}
              >
                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {meta.title ?? meta.sessionId.slice(0, 12) + "..."}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground/70">
                    <span className="truncate">
                      {meta.agentName ?? "Unknown Agent"}
                    </span>
                    <span className="opacity-50">|</span>
                    <span className="truncate">
                      {meta.cwd.split("/").pop()}
                    </span>
                    <span className="opacity-50">|</span>
                    <span className="shrink-0 font-mono text-[10px]">
                      {formatSearchTime(meta.lastActiveAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="flex items-center gap-3 px-4 py-2 border-t bg-muted/20 text-[10px] text-muted-foreground/60">
          <span>
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">
              ↑↓
            </kbd>{" "}
            导航
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">
              Enter
            </kbd>{" "}
            选择
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">
              Esc
            </kbd>{" "}
            关闭
          </span>
        </div>
      </div>
    </div>
  );
}
