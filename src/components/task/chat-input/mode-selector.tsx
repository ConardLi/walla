"use client";

import { cn } from "@/lib/utils";
import { ToggleLeft } from "lucide-react";

interface ModeSelectProps {
  modes: Array<{ id: string; name: string }>;
  currentModeId?: string;
  onChange: (modeId: string) => void;
  disabled?: boolean;
}

export function ModeSelect({
  modes,
  currentModeId,
  onChange,
  disabled,
}: ModeSelectProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <ToggleLeft className="h-3.5 w-3.5" />
      <select
        value={currentModeId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent text-xs focus:outline-none"
      >
        {modes.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
