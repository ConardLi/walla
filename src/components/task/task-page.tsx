"use client";

import { cn } from "@/lib/utils";
import { useNavStore } from "@/stores/nav-store";
import { TaskList } from "./task-list";
import { ChatView } from "./chat-view";

export function TaskPage() {
  const collapsed = useNavStore((s) => s.taskListCollapsed);

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧任务列表 */}
      <div
        className={cn(
          "border-r flex flex-col shrink-0 bg-sidebar-background transition-all duration-300 ease-in-out overflow-hidden",
          collapsed ? "w-0 border-r-0" : "w-[260px]",
        )}
      >
        <TaskList />
      </div>

      {/* 右侧对话区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView />
      </div>
    </div>
  );
}
