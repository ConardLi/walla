"use client";

import { useNavStore } from "@/stores/nav-store";
import { TaskPage } from "@/components/task/task-page";
import { AgentPage } from "@/components/agent/agent-page";
import { ModelPage } from "@/components/model/model-page";
import { MCPPage } from "@/components/mcp/mcp-page";
import { ExtensionPage } from "@/components/extension/extension-page";
import { KnowledgePage } from "@/components/knowledge/knowledge-page";
import { StatsPage } from "@/components/stats/stats-page";
import { SettingsPage } from "@/components/settings/settings-page";
import { PlaygroundEmbed } from "@/components/settings/playground-embed";

export function PageRouter() {
  const activePage = useNavStore((s) => s.activePage);

  switch (activePage) {
    case "task":
      return <TaskPage />;
    case "agent":
      return <AgentPage />;
    case "model":
      return <ModelPage />;
    case "mcp":
      return <MCPPage />;
    case "extension":
      return <ExtensionPage />;
    case "knowledge":
      return <KnowledgePage />;
    case "stats":
      return <StatsPage />;
    case "settings":
      return <SettingsPage />;
    case "playground":
      return <PlaygroundEmbed />;
    default:
      return null;
  }
}
