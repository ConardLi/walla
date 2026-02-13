"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, ToggleLeft, Cpu } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import {
  type SessionConfigOption,
  type SessionMode,
  type ModelInfo,
} from "@/types/session";

function ModeSelector({
  modes,
  sessionId,
}: {
  modes: { availableModes: SessionMode[]; currentModeId?: string };
  sessionId: string;
}) {
  const setMode = useSessionStore((s) => s.setMode);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ToggleLeft className="h-4 w-4" />
          模式切换
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {modes.availableModes.map((mode) => (
            <Button
              key={mode.id}
              size="sm"
              variant={mode.id === modes.currentModeId ? "default" : "outline"}
              className="text-xs"
              onClick={() => setMode(sessionId, mode.id)}
            >
              {mode.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ModelSelector({
  models,
  sessionId,
}: {
  models: { availableModels: ModelInfo[]; currentModelId?: string };
  sessionId: string;
}) {
  const setModel = useSessionStore((s) => s.setModel);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          模型切换
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {models.availableModels.map((model) => (
            <Button
              key={model.modelId}
              size="sm"
              variant={
                model.modelId === models.currentModelId ? "default" : "outline"
              }
              className="text-xs"
              onClick={() => setModel(sessionId, model.modelId)}
              title={model.description ?? undefined}
            >
              {model.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** 从 SDK 的 options (flat 或 grouped) 中提取出扁平的 { value, name } 列表 */
function flattenConfigOptions(
  raw: unknown[],
): Array<{ value: string; name: string }> {
  const result: Array<{ value: string; name: string }> = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    // grouped: { group, name, options: [...] }
    if ("group" in obj && Array.isArray(obj.options)) {
      for (const sub of obj.options as Record<string, unknown>[]) {
        if (typeof sub.value === "string") {
          result.push({
            value: sub.value,
            name: (sub.name as string) ?? sub.value,
          });
        }
      }
    }
    // flat: { value, name }
    else if (typeof obj.value === "string") {
      result.push({
        value: obj.value,
        name: (obj.name as string) ?? obj.value,
      });
    }
  }
  return result;
}

function ConfigOptionItem({
  option,
  sessionId,
}: {
  option: SessionConfigOption;
  sessionId: string;
}) {
  const setConfigOption = useSessionStore((s) => s.setConfigOption);
  const options = flattenConfigOptions(option.options ?? []);

  return (
    <div className="space-y-1.5 p-2 border rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{option.name}</span>
        <Badge variant="outline" className="text-[10px]">
          {option.type}
        </Badge>
      </div>
      {option.description && (
        <p className="text-xs text-muted-foreground">{option.description}</p>
      )}
      {option.type === "select" && options.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {options.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={
                opt.value === option.currentValue ? "default" : "outline"
              }
              className="text-xs h-6 px-2"
              onClick={() => setConfigOption(sessionId, option.id, opt.value)}
            >
              {opt.name}
            </Button>
          ))}
        </div>
      ) : (
        <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {option.currentValue ?? "—"}
        </div>
      )}
    </div>
  );
}

export function ConfigPanel() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const session = activeSessionId
    ? sessions.find((s) => s.sessionId === activeSessionId)
    : undefined;

  if (!session) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        请先创建或选择一个会话
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-3 p-2">
        {session.modes && session.modes.availableModes.length > 0 && (
          <ModeSelector modes={session.modes} sessionId={session.sessionId} />
        )}

        {session.models && session.models.availableModels.length > 0 && (
          <ModelSelector
            models={session.models}
            sessionId={session.sessionId}
          />
        )}

        {(() => {
          const generalOpts = (session.configOptions ?? []).filter(
            (o) => o.category !== "mode" && o.category !== "model",
          );
          return generalOpts.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  配置选项 ({generalOpts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {generalOpts.map((opt) => (
                  <ConfigOptionItem
                    key={opt.id}
                    option={opt}
                    sessionId={session.sessionId}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null;
        })()}

        {!session.modes?.availableModes.length &&
          !session.models?.availableModels.length &&
          !session.configOptions?.length && (
            <div className="text-xs text-muted-foreground text-center py-4">
              当前会话无可配置项
            </div>
          )}
      </div>
    </div>
  );
}
