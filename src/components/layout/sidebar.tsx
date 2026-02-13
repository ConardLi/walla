"use client";

import { cn } from "@/lib/utils";
import type { PlaygroundPanel } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plug,
  MessageSquare,
  Wrench,
  Settings,
  Terminal,
  FileText,
  Slash,
  Activity,
  Zap,
  BookOpen,
  Database,
} from "lucide-react";

interface SidebarProps {
  activePanel: PlaygroundPanel;
  onPanelChange: (panel: PlaygroundPanel) => void;
}

const panels: Array<{
  id: PlaygroundPanel;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "agent", label: "Agent", icon: <Plug className="h-4 w-4" /> },
  {
    id: "session",
    label: "Session",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  { id: "chat", label: "Chat", icon: <Terminal className="h-4 w-4" /> },
  { id: "batch", label: "Batch", icon: <Zap className="h-4 w-4" /> },
  { id: "mcp", label: "MCP", icon: <FileText className="h-4 w-4" /> },
  { id: "skills", label: "Skills", icon: <BookOpen className="h-4 w-4" /> },
  { id: "storage", label: "Storage", icon: <Database className="h-4 w-4" /> },
  { id: "tools", label: "Tools", icon: <Wrench className="h-4 w-4" /> },
  { id: "config", label: "Config", icon: <Settings className="h-4 w-4" /> },
  { id: "commands", label: "Commands", icon: <Slash className="h-4 w-4" /> },
  { id: "log", label: "Log", icon: <Activity className="h-4 w-4" /> },
];

export function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  return (
    <aside className="w-48 border-r flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {panels.map((panel) => (
            <Button
              key={panel.id}
              variant={activePanel === panel.id ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start gap-2",
                activePanel === panel.id && "font-semibold",
              )}
              onClick={() => onPanelChange(panel.id)}
            >
              {panel.icon}
              {panel.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
