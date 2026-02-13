"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  Palette,
  FolderOpen,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { GeneralSection } from "./general-section";
import { WorkspaceSection } from "./workspace-section";
import { PermissionsSection } from "./permissions-section";
import { ModelsSection } from "./models-section";

type SettingsTab = "general" | "workspace" | "permissions" | "models";

const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
  { id: "general", label: "通用设置", icon: <Settings className="h-4 w-4" /> },
  { id: "models", label: "模型设置", icon: <Brain className="h-4 w-4" /> },
  {
    id: "workspace",
    label: "工作目录",
    icon: <FolderOpen className="h-4 w-4" />,
  },
  {
    id: "permissions",
    label: "权限管控",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧 Tab 导航 */}
      <div className="w-[180px] border-r flex flex-col shrink-0 p-3 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
              activeTab === tab.id
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 右侧内容 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl">
          {activeTab === "general" && <GeneralSection />}
          {activeTab === "workspace" && <WorkspaceSection />}
          {activeTab === "permissions" && <PermissionsSection />}
          {activeTab === "models" && <ModelsSection />}
        </div>
      </div>
    </div>
  );
}
