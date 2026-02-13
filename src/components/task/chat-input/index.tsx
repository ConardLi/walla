"use client";

import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { Square, ToggleLeft, ArrowUp, Bot } from "lucide-react";
import type { SessionInfo } from "@/types/session";
import { ModelSelector } from "./model-selector";
import { ModeSelect } from "./mode-selector";
import { CwdSelector } from "../chat-view/cwd-selector";
import { getAgentIconByName } from "@/lib/agent-icon";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  isPrompting: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
  /** 当前 session */
  session?: SessionInfo;
  /** 可用斜杠命令 */
  availableCommands?: Array<{ name: string; description: string }>;
  /** 模式切换 */
  onModeChange?: (modeId: string) => void;
  /** 模型切换 */
  onModelChange?: (modelId: string) => void;
  /** 工作目录切换 */
  onCwdChange?: (cwd: string) => void;
  /** 工作目录只读（已有消息时不可切换） */
  cwdReadOnly?: boolean;
  /** Agent 名称（只读，仅在有消息模式展示） */
  agentName?: string;
  /** 是否为紧凑模式（已有消息时） */
  compact?: boolean;
}

export const ChatInput = memo(function ChatInput({
  input,
  setInput,
  onSend,
  onCancel,
  isPrompting,
  textareaRef,
  className,
  session,
  availableCommands,
  onModeChange,
  onModelChange,
  onCwdChange,
  cwdReadOnly,
  agentName,
  compact,
}: ChatInputProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const isSlashInput = input.startsWith("/");
  const filteredCommands = (availableCommands ?? []).filter(
    (cmd) =>
      !slashFilter ||
      cmd.name.toLowerCase().includes(slashFilter.toLowerCase()),
  );

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashFilter(val.slice(1));
      setSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }

    // 自动调整高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 240;
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight,
      )}px`;
    }
  };

  const selectCommand = (cmdName: string) => {
    setInput(`/${cmdName} `);
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) =>
          prev <= 0 ? filteredCommands.length - 1 : prev - 1,
        );
        return;
      }
      if (
        e.key === "Tab" ||
        (e.key === "Enter" && isSlashInput && !input.includes(" "))
      ) {
        e.preventDefault();
        selectCommand(filteredCommands[slashIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const hasContent = !!input.trim();

  return (
    <div className={cn("relative", className)}>
      {/* 斜杠命令浮层 */}
      {showSlashMenu && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border bg-popover shadow-lg max-h-48 overflow-auto z-50">
          {filteredCommands.map((cmd, i) => (
            <button
              key={cmd.name}
              type="button"
              onClick={() => selectCommand(cmd.name)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                i === slashIndex
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              <span className="font-mono text-xs text-primary">
                /{cmd.name}
              </span>
              <span className="text-xs truncate opacity-70">
                {cmd.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 卡片式输入框 */}
      <div className="rounded-xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring transition-shadow">
        {/* 输入区 */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的需求，让 Agent 帮你完成工作吧，/ 可唤起命令，@ 可添加文件"
            className={cn(
              "w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none max-h-[200px]",
              compact ? "min-h-[44px]" : "min-h-[75px]",
            )}
            rows={compact ? 1 : 3}
            disabled={isPrompting}
          />
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center gap-1 px-3 pb-2">
          {/* 工作目录 */}
          {onCwdChange && (
            <CwdSelector
              currentCwd={session?.cwd}
              onChange={onCwdChange}
              disabled={isPrompting}
              readOnly={cwdReadOnly}
            />
          )}

          {/* Agent 名称（只读） */}
          {agentName && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground bg-muted/30 cursor-default select-none">
              {(() => {
                const icon = getAgentIconByName(agentName);
                return icon ? (
                  <img
                    src={icon}
                    alt=""
                    className="h-3.5 w-3.5 object-contain"
                  />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                );
              })()}
              <span className="truncate max-w-[120px]">{agentName}</span>
            </div>
          )}

          {/* 模式选择 — 始终显示 */}
          {session?.modes && session.modes.availableModes.length > 0 && (
            <ModeSelect
              modes={session.modes.availableModes}
              currentModeId={session.modes.currentModeId}
              onChange={(v) => onModeChange?.(v)}
              disabled={isPrompting}
            />
          )}

          {/* 模型选择 — 始终显示 */}
          {session?.models && session.models.availableModels.length > 0 && (
            <ModelSelector
              models={session.models.availableModels}
              currentModelId={session.models.currentModelId}
              onChange={(v) => onModelChange?.(v)}
              disabled={isPrompting}
            />
          )}

          <div className="flex-1" />

          {/* 发送/取消 */}
          {isPrompting ? (
            <button
              type="button"
              onClick={onCancel}
              className="group h-8 w-8 rounded-full bg-destructive flex items-center justify-center hover:bg-destructive/90 transition-colors"
              title="取消"
            >
              <div className="h-3.5 w-3.5 bg-white rounded-[2px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!hasContent}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                hasContent
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-muted text-muted-foreground",
              )}
              title="发送"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
