"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import type { PlaygroundPanel } from "@/types/nav";
import { PanelRouter } from "@/components/playground/panel-router";

export function PlaygroundEmbed() {
  const [activePanel, setActivePanel] = useState<PlaygroundPanel>("agent");

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar activePanel={activePanel} onPanelChange={setActivePanel} />
      <main className="flex-1 overflow-hidden">
        <PanelRouter activePanel={activePanel} />
      </main>
    </div>
  );
}
