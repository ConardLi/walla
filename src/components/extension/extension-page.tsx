"use client";

import { Puzzle } from "lucide-react";

export function ExtensionPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 h-full">
      <Puzzle className="h-12 w-12" />
      <h2 className="text-lg font-medium text-foreground">扩展能力</h2>
      <p className="text-sm">MCP 和 Skills 即将支持</p>
    </div>
  );
}
