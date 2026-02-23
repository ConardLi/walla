"use client";

import { useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { TaskMode } from "@/types/nav";
import {
  Plus,
  Search,
  Settings2,
  Clock,
  Cpu,
  PlusCircle,
  RefreshCcw,
  Check,
  AlignLeft,
  List,
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
import { TaskModeTab } from "./task-mode-tab";
import { ChatConversationItem } from "./chat-conversation-item";
import { ChatConversationSearch } from "./chat-conversation-search";
import { groupByTime, groupByModel } from "./chat-conversation-list-utils";

interface ChatConversationListProps {
  taskMode: TaskMode;
  onTaskModeChange: (mode: TaskMode) => void;
}

export function ChatConversationList({
  taskMode,
  onTaskModeChange,
}: ChatConversationListProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const groupMode = useChatStore((s) => s.groupMode);
  const setGroupMode = useChatStore((s) => s.setGroupMode);
  const sortMode = useChatStore((s) => s.sortMode);
  const setSortMode = useChatStore((s) => s.setSortMode);
  const viewMode = useChatStore((s) => s.viewMode);
  const setViewMode = useChatStore((s) => s.setViewMode);
  const switchConversation = useChatStore((s) => s.switchConversation);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const toggleFavorite = useChatStore((s) => s.toggleFavorite);
  const newConversation = useChatStore((s) => s.newConversation);

  const favoritedConvs = conversations.filter((c) => c.favorited);
  const normalConvs = conversations.filter((c) => !c.favorited);

  const sortedFavoritedConvs = [...favoritedConvs].sort((a, b) =>
    sortMode === "created"
      ? b.createdAt - a.createdAt
      : b.updatedAt - a.updatedAt,
  );

  const groups =
    groupMode === "time"
      ? groupByTime(normalConvs, sortMode)
      : groupByModel(normalConvs, sortMode);

  const groupKeys = Object.keys(groups);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        <TaskModeTab value={taskMode} onChange={onTaskModeChange} />
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
                组织、排序
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
                    setGroupMode("model");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5" />
                    按模型组织
                  </span>
                  {groupMode === "model" && <Check className="h-3.5 w-3.5" />}
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
              搜索对话
            </TooltipContent>
          </Tooltip>

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
        <div className="px-3 py-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              暂无对话
            </div>
          ) : (
            <>
              {/* 收藏分组 */}
              {sortedFavoritedConvs.length > 0 && (
                <div>
                  <div className="px-2 py-4 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/90 shrink-0">
                      收藏
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {sortedFavoritedConvs.map((conv) => (
                      <ChatConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={activeConversationId === conv.id}
                        groupMode={groupMode}
                        sortMode={sortMode}
                        viewMode={viewMode}
                        onSwitch={() => switchConversation(conv.id)}
                        onRemove={() => removeConversation(conv.id)}
                        onToggleFavorite={() => toggleFavorite(conv.id)}
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
                    {groups[groupKey].map((conv) => (
                      <ChatConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={activeConversationId === conv.id}
                        groupMode={groupMode}
                        sortMode={sortMode}
                        viewMode={viewMode}
                        onSwitch={() => switchConversation(conv.id)}
                        onRemove={() => removeConversation(conv.id)}
                        onToggleFavorite={() => toggleFavorite(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <ChatConversationSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={(id) => switchConversation(id)}
      />
    </div>
  );
}
