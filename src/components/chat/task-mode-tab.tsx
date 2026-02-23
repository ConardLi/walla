"use client";

import { Bot, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskMode } from "@/types/nav";

const TABS: { value: TaskMode; label: string; icon: React.ReactNode }[] = [
  { value: "agent", label: "Agent", icon: <Bot className="h-3.5 w-3.5" /> },
  {
    value: "chat",
    label: "Chat",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
];

interface TaskModeTabProps {
  value: TaskMode;
  onChange: (mode: TaskMode) => void;
}

export function TaskModeTab({ value, onChange }: TaskModeTabProps) {
  return (
    <div className="flex items-center gap-0.5">
      {TABS.map((tab) => (
        <button
          key={tab.value}
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
      ))}
    </div>
  );
}
