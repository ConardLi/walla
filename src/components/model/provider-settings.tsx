"use client";

import { useState } from "react";
import type { ModelProvider } from "@/types/model";
import { useModelStore } from "@/stores/model-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Globe, Key, Save, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import { ModelList } from "./model-list";
import { AddProviderDialog } from "./add-provider-dialog";
import { PROVIDER_TYPE_LABELS } from "@/constants/model-providers";

interface ProviderSettingsProps {
  provider: ModelProvider;
}

function ProviderIcon({ provider }: { provider: ModelProvider }) {
  if (provider.icon) {
    return (
      <div className="h-14 w-14 rounded-xl bg-background border flex items-center justify-center overflow-hidden shadow-sm">
        <img
          src={provider.icon}
          alt={provider.name}
          className="h-9 w-9 object-contain rounded"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-2xl font-bold text-primary">${provider.name.charAt(0).toUpperCase()}</span>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl shadow-sm">
      {provider.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ProviderSettings({ provider }: ProviderSettingsProps) {
  const updateProvider = useModelStore((s) => s.updateProvider);
  const toggleProvider = useModelStore((s) => s.toggleProvider);
  const removeProvider = useModelStore((s) => s.removeProvider);

  const [apiKey, setApiKey] = useState(provider.apiKey);
  const [apiHost, setApiHost] = useState(provider.apiHost);
  const [showKey, setShowKey] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // 当切换 provider 时更新本地 state
  // 使用 React key 强制重新挂载组件是一个好方法，但这里我们在 render 里做个判断
  const [prevId, setPrevId] = useState(provider.id);
  if (provider.id !== prevId) {
    setPrevId(provider.id);
    setApiKey(provider.apiKey);
    setApiHost(provider.apiHost);
    setShowKey(false);
  }

  const hasChanges = apiKey !== provider.apiKey || apiHost !== provider.apiHost;

  function handleSave() {
    updateProvider({
      ...provider,
      apiKey: apiKey.trim(),
      apiHost: apiHost.trim() || provider.apiHost,
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 p-6 border-b bg-chat-background">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <ProviderIcon provider={provider} />
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-xl font-bold">{provider.name}</h1>
                <Badge
                  variant="secondary"
                  className="font-normal text-xs px-2 h-5 bg-muted"
                >
                  {PROVIDER_TYPE_LABELS[provider.type] ?? provider.type}
                </Badge>
                {!provider.enabled && (
                  <Badge
                    variant="outline"
                    className="font-normal text-xs px-2 h-5 text-muted-foreground border-dashed"
                  >
                    未启用
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {provider.notes ||
                  `配置 ${provider.name} 的 API 密钥和模型列表`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={provider.enabled}
              onCheckedChange={() => toggleProvider(provider.id)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEdit(true)}
              className="h-8"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              编辑信息
            </Button>
            {!provider.isSystem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeProvider(provider.id)}
                className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent hover:border-destructive/20"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                删除
              </Button>
            )}
          </div>
        </div>

        {/* 核心配置表单 */}
        <div className="grid grid-cols-2 gap-6 p-5 rounded-xl border bg-muted/20">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              API 地址
            </label>
            <Input
              value={apiHost}
              onChange={(e) => setApiHost(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
              API 密钥
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入 API Key"
                  className="bg-background pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {hasChanges && (
                <Button onClick={handleSave} className="shrink-0">
                  <Save className="h-4 w-4 mr-1.5" />
                  保存
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 模型列表区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 pb-2 shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">模型列表</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              管理该提供商下可用的模型
            </p>
          </div>
        </div>

        {/* ModelList 组件内部需要处理滚动 */}
        <div className="flex-1 overflow-y-auto px-2">
          <ModelList provider={provider} />
        </div>
      </div>

      <AddProviderDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        editProvider={provider}
      />
    </div>
  );
}
