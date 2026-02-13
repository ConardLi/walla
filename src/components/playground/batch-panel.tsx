"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Square,
  Loader2,
  CheckCircle,
  XCircle,
  FolderOpen,
  Zap,
} from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { useMessageStore } from "@/stores/message-store";
import { useAgentStore, selectAnyReady } from "@/stores/agent-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BatchTaskStatus {
  sessionId: string;
  status: "pending" | "running" | "done" | "error";
  stopReason?: string;
  error?: string;
}

export function BatchPanel() {
  const [input, setInput] = useState("");
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set(),
  );
  const [taskStatuses, setTaskStatuses] = useState<BatchTaskStatus[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessions = useSessionStore((s) => s.sessions);
  const isReady = useAgentStore(selectAnyReady);
  const messagesBySession = useMessageStore((s) => s.messagesBySession);
  const promptStates = useMessageStore((s) => s.promptStates);
  const sendPrompt = useMessageStore((s) => s.sendPrompt);
  const cancelPrompt = useMessageStore((s) => s.cancelPrompt);

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [taskStatuses, messagesBySession]);

  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions.map((s) => s.sessionId)));
    }
  };

  const handleBatchSend = async () => {
    if (!input.trim() || selectedSessions.size === 0) return;

    const text = input.trim();
    const sessionIds = Array.from(selectedSessions);

    // 初始化任务状态
    const initialStatuses: BatchTaskStatus[] = sessionIds.map((id) => ({
      sessionId: id,
      status: "pending",
    }));
    setTaskStatuses(initialStatuses);
    setIsBatchRunning(true);
    setInput("");

    // 并行发送到所有选中的 session
    const promises = sessionIds.map(async (sessionId) => {
      setTaskStatuses((prev) =>
        prev.map((t) =>
          t.sessionId === sessionId ? { ...t, status: "running" } : t,
        ),
      );

      try {
        await sendPrompt(sessionId, text);
        setTaskStatuses((prev) =>
          prev.map((t) =>
            t.sessionId === sessionId
              ? { ...t, status: "done", stopReason: "end_turn" }
              : t,
          ),
        );
      } catch (err) {
        setTaskStatuses((prev) =>
          prev.map((t) =>
            t.sessionId === sessionId
              ? { ...t, status: "error", error: (err as Error).message }
              : t,
          ),
        );
      }
    });

    await Promise.allSettled(promises);
    setIsBatchRunning(false);
  };

  const handleCancelAll = () => {
    for (const sessionId of selectedSessions) {
      cancelPrompt(sessionId);
    }
  };

  // 获取 session 的最后一条 agent 消息
  const getLastAgentMessage = (sessionId: string): string | null => {
    const msgs = messagesBySession[sessionId] ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "agent") {
        return msgs[i].content;
      }
    }
    return null;
  };

  const getSessionLabel = (sessionId: string): string => {
    const session = sessions.find((s) => s.sessionId === sessionId);
    return session?.cwd ?? sessionId;
  };

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4">
        请先创建至少一个会话
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 会话选择区 */}
      <div className="border-b p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">选择目标会话</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2"
            onClick={selectAll}
          >
            {selectedSessions.size === sessions.length ? "取消全选" : "全选"}
          </Button>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {sessions.map((session) => {
            const isPrompting =
              promptStates[session.sessionId]?.isPrompting ?? false;
            return (
              <label
                key={session.sessionId}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedSessions.has(session.sessionId)}
                  onChange={() => toggleSession(session.sessionId)}
                  disabled={isBatchRunning}
                  className="rounded border-input"
                />
                <FolderOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{session.cwd}</span>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                  {session.sessionId.slice(0, 12)}...
                </span>
                {isPrompting && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />
                )}
              </label>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          已选择 {selectedSessions.size} / {sessions.length} 个会话
        </div>
      </div>

      {/* 任务结果区 */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {taskStatuses.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-12">
              选择会话并发送消息，将同时向所有选中的会话发起任务
            </div>
          )}
          {taskStatuses.map((task) => {
            const lastReply = getLastAgentMessage(task.sessionId);
            return (
              <Card key={task.sessionId}>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    {task.status === "pending" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        等待中
                      </Badge>
                    )}
                    {task.status === "running" && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                    {task.status === "done" && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    {task.status === "error" && (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <FolderOpen className="h-3 w-3" />
                    <span className="truncate">
                      {getSessionLabel(task.sessionId)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground ml-auto">
                      {task.sessionId.slice(0, 12)}...
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {task.error && (
                    <p className="text-xs text-destructive">{task.error}</p>
                  )}
                  {lastReply && (
                    <div className="text-xs prose prose-sm dark:prose-invert max-w-none [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {lastReply.length > 500
                          ? lastReply.slice(0, 500) + "..."
                          : lastReply}
                      </ReactMarkdown>
                    </div>
                  )}
                  {task.status === "running" && !lastReply && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Agent 正在处理...
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t p-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleBatchSend();
              }
            }}
            placeholder="输入消息，将同时发送到所有选中的会话..."
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm min-h-[40px] max-h-[120px] focus:outline-none focus:ring-1 focus:ring-ring"
            rows={1}
            disabled={isBatchRunning}
          />
          {isBatchRunning ? (
            <Button size="sm" variant="destructive" onClick={handleCancelAll}>
              <Square className="h-4 w-4" />
              全部取消
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleBatchSend}
              disabled={
                !isReady || !input.trim() || selectedSessions.size === 0
              }
            >
              <Zap className="h-4 w-4" />
              批量发送 ({selectedSessions.size})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
