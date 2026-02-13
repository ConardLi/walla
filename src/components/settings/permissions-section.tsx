"use client";

import { useEffect, useState } from "react";
import { Plus, X, Wrench, Terminal, Loader2 } from "lucide-react";
import { usePermissionStore } from "@/stores/permission-store";
import { useAgentStore } from "@/stores/agent-store";
import {
  APPROVAL_MODE_LABELS,
  APPROVAL_MODE_DESCRIPTIONS,
} from "@/components/agent/constants";
import { cn } from "@/lib/utils";

export function PermissionsSection() {
  const {
    toolWhitelist,
    commandWhitelist,
    loaded,
    loadWhitelists,
    addToolToWhitelist,
    removeToolFromWhitelist,
    addCommandToWhitelist,
    removeCommandFromWhitelist,
  } = usePermissionStore();

  const connections = useAgentStore((s) => s.connections);
  const activeConnectionId = useAgentStore((s) => s.activeConnectionId);
  const updateConnection = useAgentStore((s) => s.updateConnection);

  useEffect(() => {
    if (!loaded) loadWhitelists();
  }, [loaded, loadWhitelists]);

  const activeConn = connections.find((c) => c.id === activeConnectionId);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">权限管理</h2>

      {/* 当前 Agent 权限模式 */}
      {activeConn && (
        <AgentApprovalMode
          agentName={activeConn.name}
          approvalMode={activeConn.approvalMode}
          onChangeMode={(mode) =>
            updateConnection(activeConn.id, { approvalMode: mode })
          }
        />
      )}

      {/* 工具白名单 */}
      {!loaded ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中…
        </div>
      ) : (
        <>
          <WhitelistSection
            title="工具白名单"
            description="白名单中的工具在默认模式下自动放行，无需手动确认"
            icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
            items={toolWhitelist}
            placeholder="输入工具名称，如 Read File"
            onAdd={addToolToWhitelist}
            onRemove={removeToolFromWhitelist}
          />

          <WhitelistSection
            title="命令白名单"
            description="白名单中的命令（取首段）在默认模式下自动放行"
            icon={<Terminal className="h-4 w-4 text-muted-foreground" />}
            items={commandWhitelist}
            placeholder="输入命令名称，如 ls、cat、git"
            onAdd={addCommandToWhitelist}
            onRemove={removeCommandFromWhitelist}
          />
        </>
      )}
    </div>
  );
}

// ---------- AgentApprovalMode ----------

function AgentApprovalMode({
  agentName,
  approvalMode,
  onChangeMode,
}: {
  agentName: string;
  approvalMode: "default" | "auto" | "manual";
  onChangeMode: (mode: "default" | "auto" | "manual") => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">当前 Agent：{agentName}</label>
      <div className="flex gap-2">
        {(["default", "auto", "manual"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChangeMode(mode)}
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
      <p className="text-[11px] text-muted-foreground">
        {APPROVAL_MODE_DESCRIPTIONS[approvalMode]}
      </p>
    </div>
  );
}

// ---------- WhitelistSection ----------

function WhitelistSection({
  title,
  description,
  icon,
  items,
  placeholder,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: string[];
  placeholder: string;
  onAdd: (item: string) => Promise<void>;
  onRemove: (item: string) => Promise<void>;
}) {
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    const value = input.trim();
    if (!value || items.includes(value)) return;
    await onAdd(value);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium flex items-center gap-1.5">
          {icon}
          {title}
        </label>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {description}
        </p>
      </div>

      {/* 添加输入 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          添加
        </button>
      </div>

      {/* 列表 */}
      {items.length > 0 ? (
        <div className="rounded-md border divide-y">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between px-3 py-1.5 text-sm group"
            >
              <span className="font-mono text-xs">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground py-2">暂无白名单项</p>
      )}
    </div>
  );
}
