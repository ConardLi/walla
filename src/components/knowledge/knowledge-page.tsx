"use client";

import { BookOpen } from "lucide-react";

export function KnowledgePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 h-full">
      <BookOpen className="h-12 w-12" />
      <h2 className="text-lg font-medium text-foreground">知识库</h2>
      <p className="text-sm">即将支持</p>
    </div>
  );
}
