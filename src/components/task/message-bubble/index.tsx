"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import type { Message } from "@/types/message";
import { MarkdownRenderer } from "./markdown-renderer";
import { CopyButton } from "./copy-button";
import { ToolCallBubble } from "./tool-call-bubble";

// ---------- ThoughtBubble ----------

function ThoughtBubble({ message }: { message: Message }) {
  const isThinking = !!message.isStreaming;
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const prevStreamingRef = useRef(message.isStreaming);

  // 当思考从 streaming → 结束时，自动收起
  useEffect(() => {
    if (prevStreamingRef.current && !message.isStreaming) {
      setManualExpanded(false);
    }
    prevStreamingRef.current = message.isStreaming;
  }, [message.isStreaming]);

  const expanded = manualExpanded !== null ? manualExpanded : isThinking;

  return (
    <div className="my-2">
      <button
        onClick={() => setManualExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 font-sans"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Brain
          className={`h-3.5 w-3.5 ${isThinking ? "animate-pulse text-amber-500" : ""}`}
        />
        <span>{isThinking ? "思考中..." : "思考过程"}</span>
      </button>
      {expanded && (
        <div className="ml-5 mt-1 pl-3 border-l-2 border-primary/40">
          <div className="text-[15px] text-muted-foreground whitespace-pre-wrap leading-[1.8] font-serif italic">
            {message.content}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- UserBubble ----------

const USER_MSG_MAX_LINES = 10;

function UserBubble({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);
  const lineCount = message.content.split("\n").length;
  const shouldCollapse = lineCount > USER_MSG_MAX_LINES;

  const displayContent =
    shouldCollapse && !expanded
      ? message.content.split("\n").slice(0, USER_MSG_MAX_LINES).join("\n")
      : message.content;

  return (
    <div className="group/msg flex flex-col items-end my-3">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent text-foreground px-4 py-2.5 relative overflow-hidden">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {displayContent}
        </p>

        {/* 蒙板遮罩 */}
        {shouldCollapse && !expanded && (
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-accent to-transparent pointer-events-none" />
        )}

        {shouldCollapse && (
          <div className="mt-1 flex justify-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-muted-foreground/80 hover:text-foreground transition-colors flex items-center gap-1 bg-accent/80 px-2 py-0.5 rounded-full"
            >
              {expanded ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  收起
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3" />
                  展开全部（{lineCount} 行）
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="h-5 mt-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
        <CopyButton text={message.content} />
      </div>
    </div>
  );
}

// ---------- AgentBubble ----------

function AgentBubble({ message }: { message: Message }) {
  return (
    <div className="group/msg my-3">
      <div className="text-[15px] prose prose-sm dark:prose-invert max-w-none leading-[1.8] tracking-[0.01em] wrap-break-word font-serif [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:font-mono [&_code]:break-all [&_code]:font-mono [&_p]:my-2.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_li]:pl-1 [&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:font-sans [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-sans [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-sans [&_blockquote]:border-l-primary/50 [&_blockquote]:text-muted-foreground [&_blockquote]:italic">
        <MarkdownRenderer content={message.content} />
      </div>
      {message.isStreaming ? (
        <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse rounded-sm ml-0.5 align-text-bottom" />
      ) : (
        <div className="h-5 mt-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <CopyButton text={message.content} />
        </div>
      )}
    </div>
  );
}

// ---------- ErrorBubble ----------

function ErrorBubble({ message }: { message: Message }) {
  return (
    <div className="my-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-destructive mb-0.5">请求失败</p>
        <p className="text-sm text-destructive/90 whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}

// ---------- MessageBubble ----------

export function MessageBubble({ message }: { message: Message }) {
  switch (message.role) {
    case "tool":
      return <ToolCallBubble message={message} />;
    case "thought":
      return <ThoughtBubble message={message} />;
    case "user":
      return <UserBubble message={message} />;
    case "agent":
      return <AgentBubble message={message} />;
    case "error":
      return <ErrorBubble message={message} />;
    default:
      return null;
  }
}
