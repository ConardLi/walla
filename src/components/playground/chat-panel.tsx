"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Square,
  Bot,
  User,
  Brain,
  Wrench,
  Terminal,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useMessageStore } from "@/stores/message-store";
import type { Message } from "@/types/message";
import { useSessionStore } from "@/stores/session-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ToolCallBubble({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);
  const status = message.toolStatus ?? "pending";
  const kind = message.toolKind;
  const input = message.toolInput;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> =
    {
      pending: {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        color: "text-muted-foreground",
      },
      in_progress: {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
        color: "text-blue-500",
      },
      completed: {
        icon: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
        color: "text-green-500",
      },
      failed: {
        icon: <XCircle className="h-3.5 w-3.5 text-destructive" />,
        color: "text-destructive",
      },
    };
  const sc = statusConfig[status] ?? statusConfig.pending;
  const KindIcon = kind === "execute" ? Terminal : Wrench;

  // 提取可展示的命令/描述
  const command = input?.command as string | undefined;
  const description = input?.description as string | undefined;

  return (
    <div className="mx-3 my-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <KindIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs font-medium truncate flex-1">
          {message.toolTitle}
        </span>
        {command && (
          <code className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded font-mono truncate max-w-[200px]">
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
      {expanded && input && (
        <div className="mt-1 mx-1 p-2 rounded border bg-muted/20 text-[11px] font-mono">
          {command && (
            <div className="mb-1">
              <span className="text-muted-foreground">$ </span>
              <span>{command}</span>
            </div>
          )}
          {description && (
            <div className="text-muted-foreground">{description}</div>
          )}
          {!command && (
            <pre className="whitespace-pre-wrap max-h-24 overflow-auto text-muted-foreground">
              {JSON.stringify(input, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "tool") {
    return <ToolCallBubble message={message} />;
  }

  const roleConfig = {
    user: { icon: User, label: "You", color: "bg-primary/10" },
    agent: { icon: Bot, label: "Agent", color: "bg-muted" },
    thought: { icon: Brain, label: "Thought", color: "bg-yellow-500/10" },
  };
  const config = roleConfig[message.role as "user" | "agent" | "thought"];
  const Icon = config.icon;

  return (
    <div className={`flex gap-3 p-3 rounded-lg ${config.color}`}>
      <div className="shrink-0 mt-0.5">
        <div className="h-6 w-6 rounded-full bg-background flex items-center justify-center border">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{config.label}</span>
          {message.isStreaming && (
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0 animate-pulse"
            >
              streaming
            </Badge>
          )}
        </div>
        {message.role === "user" ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none wrap-break-word [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const messagesBySession = useMessageStore((s) => s.messagesBySession);
  const promptStates = useMessageStore((s) => s.promptStates);
  const sendPrompt = useMessageStore((s) => s.sendPrompt);
  const cancelPrompt = useMessageStore((s) => s.cancelPrompt);

  const messages = activeSessionId
    ? (messagesBySession[activeSessionId] ?? [])
    : [];
  const promptState = activeSessionId
    ? (promptStates[activeSessionId] ?? {
        isPrompting: false,
        stopReason: null,
      })
    : { isPrompting: false, stopReason: null };

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !activeSessionId || promptState.isPrompting) return;
    const text = input.trim();
    setInput("");
    sendPrompt(activeSessionId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        请先创建或选择一个会话
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-12">
              发送一条消息开始对话
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {promptState.stopReason && !promptState.isPrompting && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {promptState.stopReason}
              </Badge>
              {promptState.usage && (
                <span className="text-[11px] text-muted-foreground">
                  {promptState.usage.inputTokens != null && (
                    <>输入 {promptState.usage.inputTokens}</>
                  )}
                  {promptState.usage.outputTokens != null && (
                    <> · 输出 {promptState.usage.outputTokens}</>
                  )}
                  {promptState.usage.cachedReadTokens != null &&
                    promptState.usage.cachedReadTokens > 0 && (
                      <> · 缓存 {promptState.usage.cachedReadTokens}</>
                    )}
                  {promptState.usage.totalTokens != null && (
                    <> · 共 {promptState.usage.totalTokens}</>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm min-h-[40px] max-h-[120px] focus:outline-none focus:ring-1 focus:ring-ring"
            rows={1}
            disabled={promptState.isPrompting}
          />
          {promptState.isPrompting ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => cancelPrompt(activeSessionId)}
            >
              <Square className="h-4 w-4" />
              取消
            </Button>
          ) : (
            <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
              发送
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
