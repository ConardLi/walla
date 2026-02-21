"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ModelProvider } from "@/types/model";
import { useModelStore } from "@/stores/model-store";
import { Button } from "@/components/ui/button";
import { Plus, Boxes, Search, Settings2, Trash2 } from "lucide-react";
import { AddProviderDialog } from "./add-provider-dialog";
import { ProviderSettings } from "./provider-settings";
import { Badge } from "@/components/ui/badge";

function ProviderIcon({
  provider,
  size = "md",
}: {
  provider: ModelProvider;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-2xl",
  };

  const iconSizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-9 w-9",
  };

  if (provider.icon) {
    const isSvg = provider.icon.endsWith(".svg");
    return (
      <div
        className={cn(
          "shrink-0 rounded-md flex items-center justify-center overflow-hidden border",
          isSvg ? "bg-foreground/[0.03]" : "bg-background",
          sizeClasses[size],
        )}
      >
        <img
          src={provider.icon}
          alt={provider.name}
          className={cn(
            "object-contain rounded",
            iconSizeClasses[size],
            isSvg && "dark:invert",
          )}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="font-semibold text-foreground">${provider.name.charAt(0).toUpperCase()}</span>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 rounded-md flex items-center justify-center font-semibold bg-primary/10 border border-primary/20 text-primary",
        sizeClasses[size],
      )}
    >
      {provider.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ModelPage() {
  const providers = useModelStore((s) => s.providers);
  const loaded = useModelStore((s) => s.loaded);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  const filtered = search
    ? providers
        .filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.type.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => Number(b.enabled) - Number(a.enabled))
    : providers.sort((a, b) => Number(b.enabled) - Number(a.enabled));

  // 保证选中的 provider 一定在列表中存在，如果被删除了则重置
  const activeProvider =
    providers.find((p) => p.id === activeProviderId) || null;
  // 如果没有选中项且列表不为空，默认选中第一个
  if (!activeProviderId && providers.length > 0) {
    setActiveProviderId(providers[0].id);
  }

  function handleDialogClose(open: boolean) {
    setShowAdd(open);
  }

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-background">
      {/* 左侧导航：提供商列表 */}
      <div className="w-64 border-r flex flex-col bg-muted/10 shrink-0">
        <div className="p-4 border-b shrink-0 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            模型服务商
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setShowAdd(true)}
            title="添加服务商"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 搜索 */}
        <div className="p-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background/50 focus-within:bg-background focus-within:ring-1 focus-within:ring-ring transition-all">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索..."
              className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              {search ? "无匹配结果" : "暂无服务商"}
            </div>
          ) : (
            filtered.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setActiveProviderId(provider.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                  activeProviderId === provider.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted/80",
                )}
              >
                <ProviderIcon provider={provider} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm truncate",
                        activeProviderId === provider.id
                          ? "font-semibold"
                          : "font-medium",
                      )}
                    >
                      {provider.name}
                    </span>
                    {provider.enabled && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 右侧内容：提供商详情和模型列表 */}
      <div className="flex-1 overflow-hidden bg-chat-background">
        {activeProvider ? (
          <ProviderSettings provider={activeProvider} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Settings2 className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">请在左侧选择或添加一个模型服务商</p>
          </div>
        )}
      </div>

      {/* 添加对话框 */}
      <AddProviderDialog open={showAdd} onOpenChange={handleDialogClose} />
    </div>
  );
}
