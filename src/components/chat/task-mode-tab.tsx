"use client";

import { Bot, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TaskMode } from "@/types/nav";

const TABS: {
  value: TaskMode;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "agent",
    label: "Agent",
    tooltip: "切换至 Agent 模式",
    icon: <Bot className="h-3.5 w-3.5" />,
  },
  {
    value: "chat",
    label: "Chat",
    tooltip: "切换至 Chat 模式",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
];

interface TaskModeTabProps {
  value: TaskMode;
  onChange: (mode: TaskMode) => void;
}

export function TaskModeTab({ value, onChange }: TaskModeTabProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {TABS.map((tab) => (
          <Tooltip key={tab.value} delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  value === tab.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="text-xs">
              {tab.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
