"use client";

import { cn } from "@/lib/utils";
import { useNavStore } from "@/stores/nav-store";
import { TaskList } from "./task-list";
import { ChatView } from "./chat-view";
import { ChatPage } from "@/components/chat/chat-page";
import { ChatConversationList } from "@/components/chat/chat-conversation-list";

export function TaskPage() {
  const collapsed = useNavStore((s) => s.taskListCollapsed);
  const taskMode = useNavStore((s) => s.taskMode);
  const setTaskMode = useNavStore((s) => s.setTaskMode);

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧列表 */}
      <div
        className={cn(
          "border-r flex flex-col shrink-0 bg-sidebar-background transition-all duration-300 ease-in-out overflow-hidden",
          collapsed ? "w-0 border-r-0" : "w-[260px]",
        )}
      >
        {taskMode === "agent" ? (
          <TaskList taskMode={taskMode} onTaskModeChange={setTaskMode} />
        ) : (
          <ChatConversationList
            taskMode={taskMode}
            onTaskModeChange={setTaskMode}
          />
        )}
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {taskMode === "agent" ? <ChatView /> : <ChatPage />}
      </div>
    </div>
  );
}
