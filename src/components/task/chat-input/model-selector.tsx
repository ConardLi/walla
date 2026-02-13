"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Brain, Search, Check, ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { ModelInfo } from "@/types/session";

interface ModelSelectorProps {
  models: ModelInfo[];
  currentModelId?: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

function parseProvider(modelId: string): string {
  const slashIdx = modelId.indexOf("/");
  if (slashIdx > 0) return modelId.slice(0, slashIdx);
  return "default";
}

function cleanModelName(name: string): string {
  const slashIdx = name.indexOf("/");
  if (slashIdx > 0) return name.slice(slashIdx + 1);
  return name;
}

function groupModelsByProvider(
  models: ModelInfo[],
): Record<string, ModelInfo[]> {
  const groups: Record<string, ModelInfo[]> = {};
  for (const m of models) {
    const provider = parseProvider(m.modelId);
    if (!groups[provider]) groups[provider] = [];
    groups[provider].push(m);
  }
  return groups;
}

export function ModelSelector({
  models,
  currentModelId,
  onChange,
  disabled,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentModel = models.find((m) => m.modelId === currentModelId);
  const currentLabel = currentModel
    ? cleanModelName(currentModel.name)
    : currentModelId
      ? cleanModelName(currentModelId)
      : "选择模型";

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
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.modelId.toLowerCase().includes(search.toLowerCase()),
      )
    : models;

  const groups = groupModelsByProvider(filtered);
  const groupKeys = Object.keys(groups).sort();

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
          "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <Brain className="h-3.5 w-3.5" />
        <span className="truncate max-w-[140px]">{currentLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
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
              placeholder="搜索模型..."
              className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* 分组列表 */}
          <div className="max-h-60 overflow-auto py-1">
            {groupKeys.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                无匹配模型
              </div>
            ) : (
              groupKeys.map((provider) => (
                <div key={provider}>
                  <div className="px-2 py-2 flex items-center gap-2 sticky top-0 bg-popover z-10">
                    <Separator className="flex-1" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">
                      {provider}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  {groups[provider].map((m) => (
                    <button
                      key={m.modelId}
                      type="button"
                      onClick={() => {
                        onChange(m.modelId);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors",
                        m.modelId === currentModelId
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <span className="flex-1 truncate">
                        {cleanModelName(m.name)}
                      </span>
                      {m.modelId === currentModelId && (
                        <Check className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
