"use client";

import { useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { ChatModelSelector } from "./chat-model-selector";
import { ChatSettingsPopover } from "./chat-settings-popover";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  isStreaming: boolean;
  className?: string;
  compact?: boolean;
}

export const ChatInput = memo(function ChatInput({
  input,
  setInput,
  onSend,
  onCancel,
  isStreaming,
  className,
  compact,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 240;
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight,
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      onSend();
    }
  };

  const hasContent = !!input.trim();

  return (
    <div className={cn("relative", className)}>
      <div className="rounded-3xl border bg-chat-background shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:shadow-md transition-all">
        {/* 输入区 */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你想说的话..."
            className={cn(
              "w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none max-h-[200px]",
              compact ? "min-h-[44px]" : "min-h-[75px]",
            )}
            rows={compact ? 1 : 3}
            disabled={isStreaming}
          />
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center gap-1 px-3 pb-2">
          <ChatModelSelector />
          <ChatSettingsPopover />

          <div className="flex-1" />

          {/* 发送/取消 */}
          {isStreaming ? (
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
