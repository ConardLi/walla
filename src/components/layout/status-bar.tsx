"use client";

import {
  useAgentStore,
  selectStatus,
  selectAgentInfo,
} from "@/stores/agent-store";
import { useSessionStore } from "@/stores/session-store";

export function StatusBar() {
  const status = useAgentStore(selectStatus);
  const agentInfo = useAgentStore(selectAgentInfo);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  return (
    <footer className="h-6 border-t flex items-center justify-between px-3 text-[11px] text-muted-foreground bg-muted/30 shrink-0">
      <div className="flex items-center gap-3">
        <span>
          {agentInfo ? `${agentInfo.name} v${agentInfo.version}` : status}
        </span>
        {activeSessionId && (
          <span className="font-mono truncate max-w-[200px]">
            {activeSessionId}
          </span>
        )}
      </div>
      <span>ACP Desktop</span>
    </footer>
  );
}
