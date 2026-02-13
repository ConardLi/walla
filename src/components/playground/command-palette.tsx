"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slash } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { useMessageStore } from "@/stores/message-store";

export function CommandPalette() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const session = activeSessionId
    ? sessions.find((s) => s.sessionId === activeSessionId)
    : undefined;
  const sendPrompt = useMessageStore((s) => s.sendPrompt);
  const commands = session?.availableCommands ?? [];

  if (!session) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        请先创建或选择一个会话
      </div>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        当前会话无可用斜杠命令
      </div>
    );
  }

  const handleRun = (name: string) => {
    sendPrompt(session.sessionId, `/${name}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2 p-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Slash className="h-4 w-4" />
              斜杠命令 ({commands.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-3">
            {commands.map((cmd) => (
              <div
                key={cmd.name}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium">
                      /{cmd.name}
                    </span>
                    {cmd.input && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        {cmd.input.hint}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cmd.description}
                  </p>
                </div>
                {!cmd.input && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-6"
                    onClick={() => handleRun(cmd.name)}
                  >
                    运行
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
