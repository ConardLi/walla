"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPanelProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: number;
}

export function PlaceholderPanel({ title, description, icon: Icon, phase }: PlaceholderPanelProps) {
  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            此功能将在阶段 {phase} 实现
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
