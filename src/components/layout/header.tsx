"use client";

import { Cpu, FolderOpen, Brain, ToggleLeft } from "lucide-react";
import {
  useAgentStore,
  selectReadyCount,
  selectConnectingCount,
} from "@/stores/agent-store";
import { useSessionStore } from "@/stores/session-store";

export function Header() {
  const readyCount = useAgentStore(selectReadyCount);
  const connectingCount = useAgentStore(selectConnectingCount);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const session = activeSessionId
    ? sessions.find((s) => s.sessionId === activeSessionId)
    : undefined;

  const currentMode = session?.modes?.availableModes.find(
    (m) => m.id === session?.modes?.currentModeId,
  );
  const currentModel = session?.models?.availableModels.find(
    (m) => m.modelId === session?.models?.currentModelId,
  );
  const cwd = session?.cwd;

  const dotColor =
    readyCount > 0
      ? "bg-green-500"
      : connectingCount > 0
        ? "bg-yellow-500 animate-pulse"
        : "bg-zinc-500";

  const label =
    readyCount > 0
      ? `${readyCount} Agent 已连接`
      : connectingCount > 0
        ? `${connectingCount} Agent 连接中`
        : "未连接";

  return (
    <header className="h-12 border-b flex items-center justify-between px-4 drag-region shrink-0">
      <div className="flex items-center gap-2">
        <Cpu className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-sm">ACP Playground</span>
      </div>
      <div className="flex items-center gap-3">
        {cwd && (
          <div
            className="flex items-center gap-1 text-xs text-muted-foreground"
            title={cwd}
          >
            <FolderOpen className="h-3 w-3" />
            <span className="font-mono max-w-[120px] truncate">
              {cwd.split("/").pop()}
            </span>
          </div>
        )}
        {currentModel && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Brain className="h-3 w-3" />
            <span className="max-w-[120px] truncate">{currentModel.name}</span>
          </div>
        )}
        {currentMode && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ToggleLeft className="h-3 w-3" />
            <span>{currentMode.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    </header>
  );
}
