"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FolderOpen, Check, ChevronDown, FolderPlus } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import * as ipc from "@/services/ipc-client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CwdSelectorProps {
  currentCwd?: string;
  onChange: (cwd: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function CwdSelector({
  currentCwd,
  onChange,
  disabled,
  readOnly,
}: CwdSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const directories = useWorkspaceStore((s) => s.directories);
  const addDirectory = useWorkspaceStore((s) => s.addDirectory);

  const cwdLabel = currentCwd ? currentCwd.split("/").pop() : "选择目录";

  // 点击外部关闭
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

  const handleSelectNew = async () => {
    setOpen(false);
    const result = await ipc.selectDirectory();
    if (result?.path) {
      await addDirectory(result.path);
      onChange(result.path);
    }
  };

  // 只读模式：仅展示当前目录，不可切换
  if (readOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground bg-muted/30 cursor-default">
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">{cwdLabel}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs break-all">
              {currentCwd}
              <br />
              <span className="opacity-50 text-[10px]">
                如需更改工作目录，请新建任务
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                if (!disabled) setOpen(!open);
              }}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-base transition-all",
                "bg-muted/60 hover:bg-muted/80",
                currentCwd
                  ? "text-foreground/80 hover:text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
                disabled && "opacity-50 pointer-events-none",
              )}
            >
              <FolderOpen className="h-5 w-5" />
              <span className="truncate max-w-[180px]">{cwdLabel}</span>
              <ChevronDown className="h-5 w-5 opacity-50" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs break-all">{currentCwd || "选择工作目录"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-72 rounded-lg border bg-popover shadow-lg z-50">
          <div className="max-h-64 overflow-auto py-1">
            {directories.map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => {
                  onChange(dir);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors",
                  dir === currentCwd
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate" title={dir}>
                  {dir.split("/").pop()}
                </span>
                <span
                  className="text-[10px] opacity-50 truncate max-w-[100px]"
                  title={dir}
                >
                  {dir}
                </span>
                {dir === currentCwd && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
          {/* 添加新目录 */}
          <div className="border-t">
            <button
              type="button"
              onClick={handleSelectNew}
              className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <FolderPlus className="h-4 w-4" />
              <span>选择文件夹...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
