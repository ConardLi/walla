"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Terminal,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
} from "lucide-react";
import type { Message } from "@/types/message";

const MAX_RESULT_LENGTH = 800;

const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  pending: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color: "text-muted-foreground",
    label: "等待中",
  },
  in_progress: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
    color: "text-blue-500",
    label: "执行中",
  },
  completed: {
    icon: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
    color: "text-green-500",
    label: "成功",
  },
  failed: {
    icon: <XCircle className="h-3.5 w-3.5 text-destructive" />,
    color: "text-destructive",
    label: "失败",
  },
};

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n… (已截断)";
}

/** 输入参数区 */
function ToolInputSection({ input }: { input: Record<string, unknown> }) {
  const command = input.command as string | undefined;
  const description = input.description as string | undefined;
  const filePath = (input.file_path ?? input.path) as string | undefined;

  // 过滤掉已单独展示的字段
  const extraKeys = Object.keys(input).filter(
    (k) => !["command", "description", "file_path", "path"].includes(k),
  );

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
        输入参数
      </div>
      {command && (
        <div className="flex items-start gap-1.5">
          <Terminal className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
          <code className="text-[11px] font-mono break-all">{command}</code>
        </div>
      )}
      {filePath && (
        <div className="flex items-start gap-1.5">
          <FileText className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
          <code className="text-[11px] font-mono break-all">{filePath}</code>
        </div>
      )}
      {description && (
        <div className="text-[11px] text-muted-foreground">{description}</div>
      )}
      {extraKeys.length > 0 && !command && (
        <pre className="whitespace-pre-wrap max-h-32 overflow-auto text-[11px] text-muted-foreground font-mono">
          {JSON.stringify(
            Object.fromEntries(extraKeys.map((k) => [k, input[k]])),
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}

/** 执行结果区 */
function ToolResultSection({
  toolContent,
  status,
}: {
  toolContent: Message["toolContent"];
  status: string;
}) {
  if (!toolContent || toolContent.length === 0) return null;

  const isFailed = status === "failed";

  // 提取文本内容
  const textItems = toolContent.filter(
    (c) => c.type === "content" && c.content?.text,
  );
  // 提取 diff 内容
  const diffItems = toolContent.filter((c) => c.type === "diff");
  // 提取 terminal 内容
  const terminalItems = toolContent.filter((c) => c.type === "terminal");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          {isFailed ? "错误信息" : "执行结果"}
        </div>
        {isFailed && <AlertTriangle className="h-3 w-3 text-destructive" />}
      </div>

      {/* 文本结果 */}
      {textItems.map((item, i) => {
        const text = item.content?.text ?? "";
        return (
          <pre
            key={`text-${i}`}
            className={`whitespace-pre-wrap max-h-48 overflow-auto text-[11px] font-mono rounded p-2 ${
              isFailed
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {truncateText(text, MAX_RESULT_LENGTH)}
          </pre>
        );
      })}

      {/* Diff 结果 */}
      {diffItems.map((item, i) => (
        <div key={`diff-${i}`} className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <code className="text-[10px] font-mono text-muted-foreground">
              {item.path}
            </code>
          </div>
          {item.newText && (
            <pre className="whitespace-pre-wrap max-h-48 overflow-auto text-[11px] font-mono bg-muted/40 text-muted-foreground rounded p-2">
              {truncateText(item.newText, MAX_RESULT_LENGTH)}
            </pre>
          )}
        </div>
      ))}

      {/* Terminal 结果 */}
      {terminalItems.map((item, i) => (
        <div
          key={`term-${i}`}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <Terminal className="h-3 w-3" />
          <span className="font-mono">Terminal: {item.terminalId}</span>
        </div>
      ))}
    </div>
  );
}

export function ToolCallBubble({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);
  const status = message.toolStatus ?? "pending";
  const kind = message.toolKind;
  const input = message.toolInput;
  const toolContent = message.toolContent;

  const sc = statusConfig[status] ?? statusConfig.pending;
  const KindIcon = kind === "execute" ? Terminal : Wrench;

  const command = input?.command as string | undefined;
  const hasDetails = !!(input || (toolContent && toolContent.length > 0));

  return (
    <div className="my-1 ml-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/50 hover:bg-muted/40 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <KindIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-xs font-medium truncate flex-1">
          {message.toolTitle}
        </span>
        {command && (
          <code className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded font-mono truncate max-w-[200px]">
            {command}
          </code>
        )}
        {kind && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
            {kind}
          </Badge>
        )}
        {sc.icon}
      </button>

      {expanded && hasDetails && (
        <div className="mt-1 ml-5 p-3 rounded border border-border/40 text-[11px] font-mono space-y-3">
          {/* 输入参数 */}
          {input && <ToolInputSection input={input} />}

          {/* 分隔线 */}
          {input && toolContent && toolContent.length > 0 && (
            <div className="border-t border-border/30" />
          )}

          {/* 执行结果 / 错误信息 */}
          <ToolResultSection toolContent={toolContent} status={status} />
        </div>
      )}
    </div>
  );
}
