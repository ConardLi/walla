"use client";

import { useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, Image as ImageIcon, X } from "lucide-react";
import { ChatModelSelector } from "./chat-model-selector";
import { ChatSettingsPopover } from "./chat-settings-popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ChatImage } from "@/types/chat";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  images: ChatImage[];
  setImages: (v: ChatImage[]) => void;
  onSend: () => void;
  onCancel?: () => void;
  isStreaming: boolean;
  className?: string;
  compact?: boolean;
}

export const ChatInput = memo(function ChatInput({
  input,
  setInput,
  images,
  setImages,
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = await Promise.all(
      Array.from(files).map((file) => {
        return new Promise<ChatImage>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            resolve({ data: result || "", name: file.name });
          };
          reader.readAsDataURL(file);
        });
      }),
    );

    // 过滤掉读取失败的空数据，并拼接到现有 images 后面
    const validNewImages = newImages.filter((img) => img.data !== "");
    if (validNewImages.length > 0) {
      setImages([...images, ...validNewImages]);
    }

    // reset input
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const hasContent = !!input.trim() || images.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="rounded-3xl border bg-chat-background shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:shadow-md transition-all">
        {/* 图片预览区 */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
            <TooltipProvider>
              {images.map((img, index) => (
                <Tooltip key={index} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="relative group flex items-center gap-2 bg-background border rounded-md p-1.5 pr-8 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="relative h-6 w-6 rounded overflow-hidden shrink-0 bg-muted/50">
                        <img
                          src={img.data}
                          alt={img.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span
                        className="text-xs text-muted-foreground truncate max-w-[120px]"
                        title={img.name}
                      >
                        {img.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="p-1.5 bg-background border shadow-xl w-auto max-w-none text-foreground"
                    sideOffset={8}
                    hideArrow
                  >
                    <img
                      src={img.data}
                      alt={img.name}
                      className="max-w-[300px] max-h-[300px] object-contain rounded-sm"
                    />
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}

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
          <label className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isStreaming}
            />
            <ImageIcon className="h-4 w-4" />
          </label>
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
