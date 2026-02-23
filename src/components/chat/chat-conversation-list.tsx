"use client";

import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import type { TaskMode } from "@/types/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TaskModeTab } from "./task-mode-tab";

interface ChatConversationListProps {
  taskMode: TaskMode;
  onTaskModeChange: (mode: TaskMode) => void;
}

export function ChatConversationList({
  taskMode,
  onTaskModeChange,
}: ChatConversationListProps) {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const switchConversation = useChatStore((s) => s.switchConversation);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const newConversation = useChatStore((s) => s.newConversation);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 工具栏：Tab 切换 + 新建按钮 */}
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        <TaskModeTab value={taskMode} onChange={onTaskModeChange} />
        <div className="flex-1" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={newConversation}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              新建对话
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-0.5">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              暂无对话
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => switchConversation(conv.id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && switchConversation(conv.id)
                }
                className={cn(
                  "group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer",
                  activeConversationId === conv.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span className="flex-1 truncate text-xs">{conv.title}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
