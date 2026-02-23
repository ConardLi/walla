"use client";

import { Settings2 } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function ChatSettingsPopover() {
  const settings = useChatStore((s) => s.settings);
  const updateSettings = useChatStore((s) => s.updateSettings);
  const isStreaming = useChatStore((s) => s.isStreaming);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isStreaming}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-muted/40 hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>设置</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="start">
        <div className="text-sm font-medium">模型参数</div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Temperature</label>
            <span className="text-xs font-mono tabular-nums">
              {settings.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            value={settings.temperature}
            onChange={(e) =>
              updateSettings({ temperature: parseFloat(e.target.value) })
            }
            min={0}
            max={2}
            step={0.1}
            className="w-full accent-primary h-1.5"
          />
        </div>

        {/* Top-P */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Top-P</label>
            <span className="text-xs font-mono tabular-nums">
              {settings.topP.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            value={settings.topP}
            onChange={(e) =>
              updateSettings({ topP: parseFloat(e.target.value) })
            }
            min={0}
            max={1}
            step={0.1}
            className="w-full accent-primary h-1.5"
          />
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Max Tokens</label>
          <Input
            type="number"
            value={settings.maxTokens}
            onChange={(e) =>
              updateSettings({ maxTokens: parseInt(e.target.value) || 4096 })
            }
            className="text-xs h-8"
            min={1}
            max={128000}
          />
        </div>

        {/* Frequency Penalty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              Frequency Penalty
            </label>
            <span className="text-xs font-mono tabular-nums">
              {settings.frequencyPenalty.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            value={settings.frequencyPenalty}
            onChange={(e) =>
              updateSettings({ frequencyPenalty: parseFloat(e.target.value) })
            }
            min={-2}
            max={2}
            step={0.1}
            className="w-full accent-primary h-1.5"
          />
        </div>

        {/* Presence Penalty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              Presence Penalty
            </label>
            <span className="text-xs font-mono tabular-nums">
              {settings.presencePenalty.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            value={settings.presencePenalty}
            onChange={(e) =>
              updateSettings({ presencePenalty: parseFloat(e.target.value) })
            }
            min={-2}
            max={2}
            step={0.1}
            className="w-full accent-primary h-1.5"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
