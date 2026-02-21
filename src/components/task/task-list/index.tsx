"use client";

import { useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore, selectAnyReady } from "@/stores/agent-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavStore, type TaskListViewMode } from "@/stores/nav-store";
import {
  Plus,
  FolderOpen,
  Bot,
  Clock,
  Loader2,
  Search,
  List,
  AlignLeft,
  Settings2,
  Check,
  PlusCircle,
  RefreshCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskItem } from "./task-item";
import { SessionSearch } from "./session-search";
import { groupByTime, groupByWorkspace, groupByAgent } from "./task-list-utils";

export function TaskList() {
  const groupMode = useNavStore((s) => s.taskListGroupMode);
  const setGroupMode = useNavStore((s) => s.setTaskListGroupMode);
  const sortMode = useNavStore((s) => s.taskListSortMode);
  const setSortMode = useNavStore((s) => s.setTaskListSortMode);
  const viewMode = useNavStore((s) => s.taskListViewMode);
  const setViewMode = useNavStore((s) => s.setTaskListViewMode);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // 根据 sortMode 对收藏列表排序
  const sortedFavoritedMetas = [...favoritedMetas].sort((a, b) => {
    if (sortMode === "created") {
      return b.createdAt - a.createdAt;
    } else {
      return b.lastActiveAt - a.lastActiveAt;
    }
  });

  const groups =
    groupMode === "time"
      ? groupByTime(normalMetas, sortMode)
      : groupMode === "workspace"
        ? groupByWorkspace(normalMetas, sortMode)
        : groupByAgent(normalMetas, sortMode);

  const groupKeys = Object.keys(groups);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 分组模式切换 + 新建按钮 */}
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        <div className="flex-1" />
        <TooltipProvider>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                组织、排序、展示
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              className="w-56 p-2 bg-popover/80 backdrop-blur-sm"
              align="end"
            >
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  组织方式
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGroupMode("time");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    按时间组织
                  </span>
                  {groupMode === "time" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupMode("agent");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Bot className="h-3.5 w-3.5" />按 Agent 组织
                  </span>
                  {groupMode === "agent" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupMode("workspace");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5" />
                    按工作目录组织
                  </span>
                  {groupMode === "workspace" && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  排序方式
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSortMode("created");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="h-3.5 w-3.5" />
                    按创建时间
                  </span>
                  {sortMode === "created" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortMode("updated");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    按更新时间
                  </span>
                  {sortMode === "updated" && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  显示模式
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("normal");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <AlignLeft className="h-3.5 w-3.5" />
                    详细模式
                  </span>
                  {viewMode === "normal" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("compact");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <List className="h-3.5 w-3.5" />
                    简化模式
                  </span>
                  {viewMode === "compact" && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>
            </PopoverContent>
          </Popover>

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
              搜索任务
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
              {sortedFavoritedMetas.length > 0 && (
                <div>
                  <div className="px-2 py-4 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/90 shrink-0">
                      收藏
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {sortedFavoritedMetas.map((meta) => (
                      <TaskItem
                        key={meta.sessionId}
                        meta={meta}
                        isActive={activeSessionId === meta.sessionId}
                        groupMode={groupMode}
                        viewMode={viewMode}
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
                  <div className="px-2 py-4 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/90 shrink-0">
                      {groupKey}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {groups[groupKey].map((meta) => (
                      <TaskItem
                        key={meta.sessionId}
                        meta={meta}
                        isActive={activeSessionId === meta.sessionId}
                        groupMode={groupMode}
                        viewMode={viewMode}
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
