"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Copy,
  Check,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUpdateLogStore } from "@/stores/update-log-store";
import type { LogDirection, LogCategory, UpdateLogEntry } from "@/types/log";
import { useSessionStore } from "@/stores/session-store";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";

const ALL_DIRECTIONS: LogDirection[] = ["send", "receive"];
const ALL_CATEGORIES: LogCategory[] = [
  "agent",
  "session",
  "prompt",
  "config",
  "permission",
  "skill",
  "system",
  "event",
];

const DIRECTION_LABELS: Record<LogDirection, string> = {
  send: "发送",
  receive: "接收",
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  agent: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  session: "bg-green-500/15 text-green-700 dark:text-green-400",
  prompt: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  config: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  permission: "bg-red-500/15 text-red-700 dark:text-red-400",
  skill: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  system: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  event: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
};

const PAGE_SIZE = 50;

function FilterChip({
  label,
  active,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
      } ${className}`}
    >
      {label}
    </button>
  );
}

export function UpdateLog() {
  const entries = useUpdateLogStore((s) => s.entries);
  const clear = useUpdateLogStore((s) => s.clear);
  const sessions = useSessionStore((s) => s.sessions);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // 筛选状态
  const [filterDirections, setFilterDirections] = useState<Set<LogDirection>>(
    new Set(ALL_DIRECTIONS),
  );
  const [filterCategories, setFilterCategories] = useState<Set<LogCategory>>(
    new Set(ALL_CATEGORIES),
  );
  const [filterSessionId, setFilterSessionId] = useState<string>("");
  const [filterMethod, setFilterMethod] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 分页
  const [page, setPage] = useState(1);

  // 筛选后的条目
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!filterDirections.has(e.direction)) return false;
      if (!filterCategories.has(e.category)) return false;
      if (filterSessionId && e.sessionId !== filterSessionId) return false;
      if (
        filterMethod &&
        !e.method.toLowerCase().includes(filterMethod.toLowerCase())
      )
        return false;
      return true;
    });
  }, [
    entries,
    filterDirections,
    filterCategories,
    filterSessionId,
    filterMethod,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // 当筛选条件变化时重置到最后一页
  useEffect(() => {
    setPage(totalPages);
  }, [totalPages]);

  const pageEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // 自动滚动到底部（仅在最后一页时）
  useEffect(() => {
    if (autoScroll && page === totalPages && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [pageEntries.length, autoScroll, page, totalPages]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  const scrollToBottom = () => {
    setPage(totalPages);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setAutoScroll(true);
    }, 50);
  };

  const toggleDirection = (d: LogDirection) => {
    setFilterDirections((prev) => {
      const next = new Set(prev);
      if (next.has(d)) {
        if (next.size > 1) next.delete(d);
      } else {
        next.add(d);
      }
      return next;
    });
  };

  const toggleCategory = (c: LogCategory) => {
    setFilterCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllCategories = () =>
    setFilterCategories(new Set(ALL_CATEGORIES));
  const clearAllCategories = () =>
    setFilterCategories(new Set([ALL_CATEGORIES[0]]));

  const copyAll = async () => {
    const text = filtered
      .map((e) => JSON.stringify(e, null, 2))
      .join("\n---\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 收集所有出现过的 sessionId
  const sessionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of entries) {
      if (e.sessionId) ids.add(e.sessionId);
    }
    return [...ids];
  }, [entries]);

  const activeFiltersCount =
    (filterDirections.size < ALL_DIRECTIONS.length ? 1 : 0) +
    (filterCategories.size < ALL_CATEGORIES.length ? 1 : 0) +
    (filterSessionId ? 1 : 0) +
    (filterMethod ? 1 : 0);

  return (
    <div className="flex flex-col h-full relative">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            通信日志
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {filtered.length}/{entries.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={showFilters ? "default" : "ghost"}
            size="sm"
            className="h-6 px-1.5 text-xs gap-1"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Search className="h-3 w-3" />
            筛选
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="text-[9px] px-1 py-0 ml-0.5"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs gap-1"
            onClick={copyAll}
            disabled={filtered.length === 0}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={clear}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="px-3 py-2 border-b space-y-2 bg-muted/30">
          {/* 方向 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">
              方向
            </span>
            {ALL_DIRECTIONS.map((d) => (
              <FilterChip
                key={d}
                label={`${d === "send" ? "↑" : "↓"} ${DIRECTION_LABELS[d]}`}
                active={filterDirections.has(d)}
                onClick={() => toggleDirection(d)}
              />
            ))}
          </div>

          {/* 类型 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">
              类型
            </span>
            {ALL_CATEGORIES.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={filterCategories.has(c)}
                onClick={() => toggleCategory(c)}
                className={filterCategories.has(c) ? CATEGORY_COLORS[c] : ""}
              />
            ))}
            <button
              onClick={selectAllCategories}
              className="text-[10px] text-muted-foreground hover:text-foreground ml-1"
            >
              全选
            </button>
            <button
              onClick={clearAllCategories}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              最少
            </button>
          </div>

          {/* Session */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">
              Session
            </span>
            <FilterChip
              label="全部"
              active={!filterSessionId}
              onClick={() => setFilterSessionId("")}
            />
            {sessionIds.map((sid) => {
              const session = sessions.find((s) => s.sessionId === sid);
              const label = session ? sid.slice(0, 8) : sid.slice(0, 8);
              return (
                <FilterChip
                  key={sid}
                  label={label}
                  active={filterSessionId === sid}
                  onClick={() =>
                    setFilterSessionId(filterSessionId === sid ? "" : sid)
                  }
                />
              );
            })}
          </div>

          {/* Method 搜索 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">
              方法
            </span>
            <div className="relative flex-1">
              <Input
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                placeholder="搜索 method 名称..."
                className="h-6 text-[10px] font-mono pr-6"
              />
              {filterMethod && (
                <button
                  onClick={() => setFilterMethod("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 日志列表 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="p-2 space-y-1">
          {pageEntries.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              {entries.length === 0 ? "等待通信日志..." : "没有匹配的日志条目"}
            </div>
          )}
          {pageEntries.map((entry) => (
            <LogEntryItem
              key={entry.id}
              entry={entry}
              expanded={expandedIds.has(entry.id)}
              onToggle={() => toggleExpand(entry.id)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/20">
          <span className="text-[10px] text-muted-foreground">
            第 {page}/{totalPages} 页 · 共 {filtered.length} 条
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* 滚动到底部按钮 */}
      {!autoScroll && page === totalPages && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-10 right-3 h-7 px-2 text-xs gap-1 shadow-md"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-3 w-3" />
          底部
        </Button>
      )}
    </div>
  );
}

function LogEntryItem({
  entry,
  expanded,
  onToggle,
}: {
  entry: UpdateLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isSend = entry.direction === "send";
  const jsonStr = JSON.stringify(entry.raw, null, 2);
  const isLong = jsonStr.length > 200;

  return (
    <div
      className={`text-[11px] font-mono border rounded p-1.5 hover:bg-muted/50 cursor-pointer ${
        isSend
          ? "border-l-2 border-l-blue-400"
          : "border-l-2 border-l-green-400"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
        {/* 方向 */}
        {isSend ? (
          <ArrowUp className="h-3 w-3 text-blue-500 shrink-0" />
        ) : (
          <ArrowDown className="h-3 w-3 text-green-500 shrink-0" />
        )}
        {/* 类型 */}
        <span
          className={`px-1 py-0 rounded text-[9px] font-medium ${
            CATEGORY_COLORS[entry.category]
          }`}
        >
          {entry.category}
        </span>
        {/* 方法 */}
        <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
          {entry.method}
        </Badge>
        {/* Session */}
        {entry.sessionId && (
          <span className="text-[9px] text-muted-foreground font-mono">
            {entry.sessionId.slice(0, 8)}
          </span>
        )}
        {/* 时间 */}
        <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
          {new Date(entry.timestamp).toLocaleTimeString("zh-CN", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
          .{String(entry.timestamp % 1000).padStart(3, "0")}
        </span>
        {/* 展开提示 */}
        {isLong && !expanded && (
          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
        )}
      </div>
      <pre
        className={`whitespace-pre-wrap text-muted-foreground ${
          expanded ? "max-h-[500px]" : "max-h-16"
        } overflow-auto transition-all`}
      >
        {jsonStr}
      </pre>
    </div>
  );
}
