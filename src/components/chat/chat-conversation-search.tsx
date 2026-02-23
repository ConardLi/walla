"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type { ChatConversation } from "@/types/chat";

interface ChatConversationSearchProps {
  open: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
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

export function ChatConversationSearch({
  open,
  onClose,
  conversations,
  activeConversationId,
  onSelect,
}: ChatConversationSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            (c.modelId ?? "").toLowerCase().includes(q),
        )
      : [...conversations];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations, query]);

  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
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
          handleSelect(results[selectedIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

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
            placeholder="搜索对话…"
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

        {/* 搜索结果 */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              无匹配结果
            </div>
          ) : (
            results.map((conv, idx) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleSelect(conv.id)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                  idx === selectedIndex
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50",
                  activeConversationId === conv.id && "border-l-2 border-primary",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {conv.title || "新对话"}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground/70">
                    <span className="truncate">{conv.modelId || "未知模型"}</span>
                    <span className="opacity-50">|</span>
                    <span className="shrink-0 font-mono text-[10px]">
                      {formatSearchTime(conv.updatedAt)}
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
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">↑↓</kbd>{" "}
            导航
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">Enter</kbd>{" "}
            选择
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">Esc</kbd>{" "}
            关闭
          </span>
        </div>
      </div>
    </div>
  );
}
