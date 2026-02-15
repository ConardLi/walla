"use client";

import { cn } from "@/lib/utils";
import { useNavStore } from "@/stores/nav-store";
import type { NavPage } from "@/types/nav";
import {
  MessageSquare,
  Bot,
  Blocks,
  Puzzle,
  BookOpen,
  BarChart3,
  Settings,
  FlaskConical,
} from "lucide-react";

const topItems: Array<{ id: NavPage; label: string; icon: React.ReactNode }> = [
  { id: "task", label: "任务", icon: <MessageSquare className="h-5 w-5" /> },
  { id: "agent", label: "Agent", icon: <Bot className="h-5 w-5" /> },
  { id: "mcp", label: "MCP", icon: <Blocks className="h-5 w-5" /> },
  { id: "extension", label: "扩展", icon: <Puzzle className="h-5 w-5" /> },
  { id: "knowledge", label: "知识库", icon: <BookOpen className="h-5 w-5" /> },
];

const bottomItems: Array<{
  id: NavPage;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "playground",
    label: "Playground",
    icon: <FlaskConical className="h-5 w-5" />,
  },
  { id: "stats", label: "统计", icon: <BarChart3 className="h-5 w-5" /> },
  { id: "settings", label: "设置", icon: <Settings className="h-5 w-5" /> },
];

export function NavBar() {
  const activePage = useNavStore((s) => s.activePage);
  const setActivePage = useNavStore((s) => s.setActivePage);
  const collapsed = useNavStore((s) => s.taskListCollapsed);

  const isHidden = activePage === "task" && collapsed;

  return (
    <aside
      className={cn(
        "w-12 border-r flex flex-col shrink-0 bg-muted/30 transition-all duration-300 ease-in-out",
        isHidden && "w-0 border-r-0 overflow-hidden",
      )}
    >
      {/* 上半部分 */}
      <div className="flex-1 flex flex-col items-center gap-1 pt-2">
        {topItems.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activePage === item.id}
            onClick={() => setActivePage(item.id)}
          />
        ))}
      </div>
      {/* 下半部分 */}
      <div className="flex flex-col items-center gap-1 pb-2">
        {bottomItems.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activePage === item.id}
            onClick={() => setActivePage(item.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-md transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-accent",
          active && "bg-accent text-foreground",
        )}
      >
        {icon}
      </button>
      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-popover border text-popover-foreground text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
        {label}
      </span>
    </div>
  );
}
