"use client";

import { useEffect, useRef } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useSessionStore } from "@/stores/session-store";
import { useMessageStore } from "@/stores/message-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { ChatInput } from "../chat-input";
import { AgentSelector } from "./agent-selector";
import { CwdSelector } from "./cwd-selector";
import { MessageList } from "./message-list";
import { ChatInputWrapper } from "./chat-input-wrapper";
import { ChatSkeleton } from "./chat-skeleton";
import { RotatingText } from "@/components/ui/rotating-text";

/**
 * 轻量 hook：只订阅"当前 session 是否有消息"这一布尔值，
 * 避免每次 appendChunk 都触发 ChatView 重渲染。
 */
function useHasMessages(sessionId: string | null) {
  return useMessageStore((s) => {
    if (!sessionId) return false;
    const msgs = s.messagesBySession[sessionId];
    return !!msgs && msgs.length > 0;
  });
}

function useIsPrompting(sessionId: string | null) {
  return useMessageStore((s) => {
    if (!sessionId) return false;
    return s.promptStates[sessionId]?.isPrompting ?? false;
  });
}

export function ChatView() {
  const chat = useChat();
  const setMode = useSessionStore((s) => s.setMode);
  const setModel = useSessionStore((s) => s.setModel);
  const changeCwd = useSessionStore((s) => s.changeCwd);
  const addDirectory = useWorkspaceStore((s) => s.addDirectory);
  const isCreating = useSessionStore((s) => s.isCreating);
  const sessionMetas = useSessionStore((s) => s.sessionMetas);
  const autoCreateRef = useRef(false);

  const directories = useWorkspaceStore((s) => s.directories);

  const hasMessages = useHasMessages(chat.activeSessionId);
  const isPrompting = useIsPrompting(chat.activeSessionId);

  // 自动创建 session：agent ready 且无 activeSession 时，使用默认 cwd
  useEffect(() => {
    if (
      chat.anyReady &&
      !chat.activeSessionId &&
      !isCreating &&
      !autoCreateRef.current
    ) {
      autoCreateRef.current = true;
      const defaultCwd = directories[0] || "/tmp";
      chat.createSession(defaultCwd, { persist: false }).catch(() => {
        autoCreateRef.current = false;
      });
    }
  }, [chat.anyReady, chat.activeSessionId, isCreating]);

  // 当切换到其他 session 时，重置 autoCreate
  useEffect(() => {
    if (chat.activeSessionId) {
      autoCreateRef.current = false;
    }
  }, [chat.activeSessionId]);

  const handleCwdChange = async (cwd: string) => {
    addDirectory(cwd);
    if (chat.activeSessionId) {
      const msgs =
        useMessageStore.getState().messagesBySession[chat.activeSessionId];
      if (!msgs || msgs.length === 0) {
        // 空消息状态：丢弃旧 session，用新 cwd 重新创建
        const oldId = chat.activeSessionId;
        useSessionStore.setState((state) => ({
          sessions: state.sessions.filter((s) => s.sessionId !== oldId),
          activeSessionId: null,
        }));
        await chat.createSession(cwd, { persist: false });
      } else {
        changeCwd(chat.activeSessionId, cwd);
      }
    }
  };

  const activeMeta = chat.activeSessionId
    ? sessionMetas.find((m) => m.sessionId === chat.activeSessionId)
    : undefined;

  // activeSessionId 已设置但 session 尚未加载到运行时列表（loadSession 进行中）→ 骨架屏
  if (chat.activeSessionId && !chat.activeSession) {
    return <ChatSkeleton />;
  }

  // Agent 未连接 或 正在创建 session
  if (!chat.activeSessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <Bot className="h-10 w-10 mx-auto opacity-30" />
            <h2 className="text-lg font-medium text-foreground">
              开始新的任务
            </h2>
            <p className="text-sm text-muted-foreground">
              {chat.anyReady ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  正在准备会话...
                </span>
              ) : (
                "请先连接 Agent"
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 有 activeSession 但无消息：居中展示卡片式输入框
  if (!hasMessages && !isPrompting) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center space-y-3">
              <RotatingText />
              <div className="flex justify-center items-center gap-4">
                <AgentSelector />
                <CwdSelector
                  currentCwd={chat.activeSession?.cwd}
                  onChange={handleCwdChange}
                  disabled={false}
                  readOnly={false}
                />
              </div>
            </div>
            <ChatInput
              input={chat.input}
              setInput={chat.setInput}
              onSend={chat.handleSend}
              textareaRef={chat.textareaRef}
              session={chat.activeSession}
              availableCommands={chat.availableCommands}
              onModeChange={(modeId: string) =>
                chat.activeSessionId && setMode(chat.activeSessionId, modeId)
              }
              onModelChange={(modelId: string) =>
                chat.activeSessionId && setModel(chat.activeSessionId, modelId)
              }
              isPrompting={false}
              className="max-w-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  // 有消息：正常对话布局，输入框在底部
  return (
    <div className="flex flex-col h-full">
      {/* 消息区域 — 独立订阅 store，隔离高频渲染 */}
      <MessageList sessionId={chat.activeSessionId} />

      {/* 底部输入 — 独立订阅 isPrompting */}
      <div className="p-3">
        <ChatInputWrapper
          sessionId={chat.activeSessionId}
          input={chat.input}
          setInput={chat.setInput}
          onSend={chat.handleSend}
          onCancel={chat.handleCancel}
          textareaRef={chat.textareaRef}
          session={chat.activeSession}
          availableCommands={chat.availableCommands}
          onModeChange={(modeId: string) =>
            chat.activeSessionId && setMode(chat.activeSessionId, modeId)
          }
          onModelChange={(modelId: string) =>
            chat.activeSessionId && setModel(chat.activeSessionId, modelId)
          }
          onCwdChange={handleCwdChange}
          cwdReadOnly
          agentName={activeMeta?.agentName}
          className="max-w-3xl mx-auto"
          compact
        />
      </div>
    </div>
  );
}
