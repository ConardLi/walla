"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/stores/model-store";
import { useChatStore } from "@/stores/chat-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ChatModelSelector() {
  const [open, setOpen] = useState(false);
  const providers = useModelStore((s) => s.providers);
  const selectedProviderId = useChatStore((s) => s.selectedProviderId);
  const selectedModelId = useChatStore((s) => s.selectedModelId);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const isStreaming = useChatStore((s) => s.isStreaming);

  // 只显示已启用且有 apiKey 的提供商
  const enabledProviders = providers.filter(
    (p) => p.enabled && p.apiKey,
  );

  // 获取当前选中的模型信息
  const currentProvider = providers.find((p) => p.id === selectedProviderId);
  const currentModel = currentProvider?.models.find(
    (m) => m.id === selectedModelId,
  );

  const displayText = currentModel
    ? `${currentProvider?.name} / ${currentModel.name}`
    : "选择模型";

  const handleSelect = (providerId: string, modelId: string) => {
    setSelectedModel(providerId, modelId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isStreaming}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs",
            "bg-muted/40 hover:bg-muted/60 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !currentModel && "text-muted-foreground",
          )}
        >
          <span className="truncate max-w-[200px]">{displayText}</span>
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 max-h-80 flex flex-col"
        align="start"
      >
        <div className="overflow-y-auto p-1">
          {enabledProviders.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              暂无可用模型，请先在模型管理中配置
            </div>
          ) : (
            enabledProviders.map((provider) => {
              const enabledModels = provider.models.filter((m) => m.enabled);
              if (enabledModels.length === 0) return null;
              return (
                <div key={provider.id}>
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {provider.name}
                  </div>
                  {enabledModels.map((model) => {
                    const isSelected =
                      selectedProviderId === provider.id &&
                      selectedModelId === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleSelect(provider.id, model.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{model.name}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
