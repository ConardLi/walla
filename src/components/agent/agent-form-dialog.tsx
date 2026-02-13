"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { FolderOpen, Check, ChevronDown, FolderPlus } from "lucide-react";
import * as ipc from "@/services/ipc-client";
import { EnvEditor } from "./env-editor";
import { APPROVAL_MODE_LABELS, APPROVAL_MODE_DESCRIPTIONS } from "./constants";
import type { AgentConnection } from "@/types/agent";

export type AgentFormData = Omit<
  AgentConnection,
  "id" | "createdAt" | "lastUsedAt"
>;

export interface AgentFormPrefill {
  name?: string;
  command?: string;
  args?: string;
}

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AgentConnection;
  prefill?: AgentFormPrefill;
  onSave: (data: AgentFormData) => void;
}

export function AgentFormDialog({
  open,
  onOpenChange,
  initial,
  prefill,
  onSave,
}: AgentFormDialogProps) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [cwd, setCwd] = useState("");
  const [env, setEnv] = useState<Record<string, string>>({});
  const [approvalMode, setApprovalMode] = useState<
    "default" | "auto" | "manual"
  >("default");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? prefill?.name ?? "");
      setCommand(initial?.command ?? prefill?.command ?? "");
      setArgs(initial?.args?.join(" ") ?? prefill?.args ?? "");
      setCwd(initial?.cwd ?? "");
      setEnv(initial?.env ?? {});
      setApprovalMode(initial?.approvalMode ?? "default");
    }
  }, [open, initial, prefill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !command.trim()) return;
    onSave({
      name: name.trim(),
      command: command.trim(),
      args: args.trim() ? args.trim().split(/\s+/) : [],
      cwd: cwd.trim() || undefined,
      env: Object.keys(env).length > 0 ? env : undefined,
      approvalMode,
      isDefault: initial?.isDefault,
    });
  };

  const isValid = name.trim() && command.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "编辑 Agent" : "新建 Agent"}</DialogTitle>
          <DialogDescription>
            {initial ? "修改 Agent 连接配置" : "配置一个新的 Agent 连接"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="名称">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: opencode"
              required
            />
          </FormField>

          <div className="grid grid-cols-5 gap-2">
            <FormField label="启动命令" className="col-span-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="例如: npx"
                required
              />
            </FormField>
            <FormField label="参数" className="col-span-3">
              <Input
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="例如: -y opencode-ai acp"
              />
            </FormField>
          </div>

          <FormField label="默认工作目录（可选）">
            <CwdField value={cwd} onChange={setCwd} />
          </FormField>

          <FormField label="环境变量（可选）">
            <EnvEditor value={env} onChange={setEnv} />
          </FormField>

          <FormField label="权限模式">
            <div className="flex gap-2">
              {(["default", "auto", "manual"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setApprovalMode(mode)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                    approvalMode === mode
                      ? "border-primary bg-primary/10 text-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {APPROVAL_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {APPROVAL_MODE_DESCRIPTIONS[approvalMode]}
            </p>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={!isValid}>
              {initial ? "保存" : "添加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- FormField ----------

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

// ---------- CwdField ----------

function CwdField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const directories = useWorkspaceStore((s) => s.directories);
  const addDirectory = useWorkspaceStore((s) => s.addDirectory);

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

  const displayLabel = value
    ? value.split("/").pop() || value
    : "留空使用默认目录";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition-colors",
          value ? "text-foreground" : "text-muted-foreground",
          "hover:bg-accent/50",
        )}
      >
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{displayLabel}</span>
        {value && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
            {value}
          </span>
        )}
        <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-lg border bg-popover shadow-lg z-50">
          <div className="max-h-40 overflow-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors",
                !value
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <span className="flex-1">留空（使用默认目录）</span>
              {!value && <Check className="h-3 w-3 shrink-0" />}
            </button>

            {directories.map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => {
                  onChange(dir);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors",
                  dir === value
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <FolderOpen className="h-3 w-3 shrink-0" />
                <span className="flex-1 truncate" title={dir}>
                  {dir.split("/").pop()}
                </span>
                <span
                  className="text-[10px] opacity-50 truncate max-w-[80px]"
                  title={dir}
                >
                  {dir}
                </span>
                {dir === value && <Check className="h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>
          <div className="border-t">
            <button
              type="button"
              onClick={handleSelectNew}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>选择文件夹...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
