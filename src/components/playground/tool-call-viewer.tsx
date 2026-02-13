"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wrench,
  FileText,
  Terminal,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { useToolCallStore } from "@/stores/tool-call-store";
import type { ToolCall } from "@/types/tool-call";
import { useSessionStore } from "@/stores/session-store";

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    case "running":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    default:
      return (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      );
  }
}

function KindIcon({ kind }: { kind?: string }) {
  switch (kind) {
    case "read":
    case "write":
      return <FileText className="h-3.5 w-3.5" />;
    case "execute":
      return <Terminal className="h-3.5 w-3.5" />;
    default:
      return <Wrench className="h-3.5 w-3.5" />;
  }
}

function ToolCallItem({ tc }: { tc: ToolCall }) {
  return (
    <div className="border rounded-md p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <KindIcon kind={tc.kind} />
        <span className="text-xs font-medium flex-1 truncate">{tc.title}</span>
        <StatusIcon status={tc.status} />
        {tc.kind && (
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {tc.kind}
          </Badge>
        )}
      </div>

      {tc.content.length > 0 && (
        <div className="space-y-1">
          {tc.content.map((c, i) => (
            <div key={i} className="text-xs bg-muted rounded p-1.5">
              {c.type === "diff" && (
                <div>
                  <span className="text-muted-foreground">diff: </span>
                  <span className="font-mono">{c.path}</span>
                </div>
              )}
              {c.type === "terminal" && (
                <div>
                  <Terminal className="h-3 w-3 inline mr-1" />
                  <span className="font-mono">{c.terminalId}</span>
                </div>
              )}
              {c.type === "content" && c.content?.text && (
                <pre className="whitespace-pre-wrap max-h-24 overflow-auto">
                  {c.content.text}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ToolCallViewer() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const toolCallsBySession = useToolCallStore((s) => s.toolCallsBySession);
  const toolCalls = activeSessionId
    ? (toolCallsBySession[activeSessionId] ?? [])
    : [];

  if (!activeSessionId || toolCalls.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        暂无工具调用
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {toolCalls.map((tc) => (
          <ToolCallItem key={tc.toolCallId} tc={tc} />
        ))}
      </div>
    </ScrollArea>
  );
}
