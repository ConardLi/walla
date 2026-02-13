"use client";

import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import {
  useAgentStore,
  selectReadyCount,
  selectConnectingCount,
} from "@/stores/agent-store";
import { useNavStore } from "@/stores/nav-store";

export function TitleBar() {
  const readyCount = useAgentStore(selectReadyCount);
  const connectingCount = useAgentStore(selectConnectingCount);
  const activePage = useNavStore((s) => s.activePage);
  const collapsed = useNavStore((s) => s.taskListCollapsed);
  const toggle = useNavStore((s) => s.toggleTaskList);

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
    <header className="h-11 border-b flex items-center justify-end shrink-0 bg-background drag-region relative">
      {/* 左侧：macOS 操作区预留 + 任务列表展开/收起按钮，与红绿灯垂直对齐 */}
      {activePage === "task" && (
        <button
          type="button"
          onClick={toggle}
          className="absolute left-[78px] top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors no-drag"
          title={collapsed ? "展开任务列表" : "收起任务列表"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      )}

      {/* 右侧：状态指示 */}
      <div className="flex items-center gap-1.5 pr-4 no-drag">
        <div className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </header>
  );
}
