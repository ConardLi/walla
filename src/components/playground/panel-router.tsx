"use client";

import type { PlaygroundPanel } from "@/types/nav";
import { AgentPanel } from "./agent-panel";
import { SessionPanel } from "./session-panel";
import { ChatPanel } from "./chat-panel";
import { ToolCallViewer } from "./tool-call-viewer";
import { ConfigPanel } from "./config-panel";
import { CommandPalette } from "./command-palette";
import { UpdateLog } from "./update-log";
import { BatchPanel } from "./batch-panel";
import { McpPanel } from "./mcp-panel";
import { SkillsPanel } from "./skills-panel";
import { StoragePanel } from "./storage-panel";

interface PanelRouterProps {
  activePanel: PlaygroundPanel;
}

export function PanelRouter({ activePanel }: PanelRouterProps) {
  switch (activePanel) {
    case "agent":
      return (
        <div className="p-4 overflow-auto h-full">
          <AgentPanel />
        </div>
      );
    case "session":
      return (
        <div className="p-4 overflow-auto h-full">
          <SessionPanel />
        </div>
      );
    case "chat":
      return <ChatPanel />;
    case "batch":
      return <BatchPanel />;
    case "mcp":
      return (
        <div className="p-4 overflow-auto h-full">
          <McpPanel />
        </div>
      );
    case "skills":
      return (
        <div className="p-4 overflow-auto h-full">
          <SkillsPanel />
        </div>
      );
    case "storage":
      return (
        <div className="p-4 overflow-auto h-full">
          <StoragePanel />
        </div>
      );
    case "tools":
      return <ToolCallViewer />;
    case "config":
      return <ConfigPanel />;
    case "commands":
      return <CommandPalette />;
    case "log":
      return <UpdateLog />;
    default:
      return null;
  }
}
