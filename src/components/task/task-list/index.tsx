"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore, selectAnyReady } from "@/stores/agent-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavStore } from "@/stores/nav-store";
import {
  Plus,
  FolderOpen,
  Bot,
  Clock,
  Loader2,
  Star,
  Search,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { TaskItem } from "./task-item";
import { SessionSearch } from "./session-search";
import { groupByTime, groupByWorkspace, groupByAgent } from "./task-list-utils";

export function TaskList() {
  const groupMode = useNavStore((s) => s.taskListGroupMode);
  const setGroupMode = useNavStore((s) => s.setTaskListGroupMode);
  const [searchOpen, setSearchOpen] = useState(false);
  const sessionMetas = useSessionStore((s) => s.sessionMetas);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const switchToSession = useSessionStore((s) => s.switchToSession);
  const createSession = useSessionStore((s) => s.createSession);
  const removeSession = useSessionStore((s) => s.removeSession);
  const toggleFavorite = useSessionStore((s) => s.toggleFavorite);
  const isCreating = useSessionStore((s) => s.isCreating);
  const anyReady = useAgentStore(selectAnyReady);

  const directories = useWorkspaceStore((s) => s.directories);

  const handleNewSession = async () => {
    if (!anyReady) return;
    try {
      const defaultCwd = directories[0] || "/tmp";
      await createSession(defaultCwd, { persist: false });
    } catch (err) {
      console.error("[TaskList] create session failed:", err);
    }
  };

  // 收藏的 session 单独分组置顶
  const favoritedMetas = sessionMetas.filter((m) => m.favorited);
  const normalMetas = sessionMetas.filter((m) => !m.favorited);

  const groups =
    groupMode === "time"
      ? groupByTime(normalMetas)
      : groupMode === "workspace"
        ? groupByWorkspace(normalMetas)
        : groupByAgent(normalMetas);

  const groupKeys = Object.keys(groups);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 分组模式切换 + 新建按钮 */}
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        <div className="flex-1 flex items-center gap-1">
          <TooltipProvider>
            {(
              [
                { mode: "time" as const, icon: Clock, label: "按时间组织" },
                { mode: "agent" as const, icon: Bot, label: "按 Agent 组织" },
                {
                  mode: "workspace" as const,
                  icon: FolderOpen,
                  label: "按工作目录组织",
                },
              ] as const
            ).map(({ mode, icon: Icon, label }) => (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setGroupMode(mode)}
                    className={cn(
                      "p-1 rounded transition-colors",
                      groupMode === mode
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              搜索会话
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleNewSession}
                disabled={!anyReady || isCreating}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              新建任务
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-1">
          {sessionMetas.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              暂无任务
            </div>
          ) : (
            <>
              {/* 收藏分组 */}
              {favoritedMetas.length > 0 && (
                <div>
                  <div className="px-2 py-1 flex items-center gap-2">
                    <Separator className="flex-1" />
                    <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground/80 shrink-0">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      收藏
                    </div>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-0.5">
                    {favoritedMetas.map((meta) => (
                      <TaskItem
                        key={meta.sessionId}
                        meta={meta}
                        isActive={activeSessionId === meta.sessionId}
                        groupMode={groupMode}
                        onSwitch={() => switchToSession(meta.sessionId)}
                        onRemove={() => removeSession(meta.sessionId)}
                        onToggleFavorite={() => toggleFavorite(meta.sessionId)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* 普通分组 */}
              {groupKeys.map((groupKey) => (
                <div key={groupKey}>
                  <div className="px-2 py-1 flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-xs font-semibold text-muted-foreground/80 shrink-0">
                      {groupKey}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-0.5">
                    {groups[groupKey].map((meta) => (
                      <TaskItem
                        key={meta.sessionId}
                        meta={meta}
                        isActive={activeSessionId === meta.sessionId}
                        groupMode={groupMode}
                        onSwitch={() => switchToSession(meta.sessionId)}
                        onRemove={() => removeSession(meta.sessionId)}
                        onToggleFavorite={() => toggleFavorite(meta.sessionId)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <SessionSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        sessionMetas={sessionMetas}
        activeSessionId={activeSessionId}
        onSelect={(id) => switchToSession(id)}
      />
    </div>
  );
}
