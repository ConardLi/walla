"use client";

import { useState, useEffect } from "react";
import { useModelStore } from "@/stores/model-store";
import type { ModelProvider, ProviderType } from "@/types/model";
import {
  BUILTIN_PROVIDER_TEMPLATES,
  createProviderFromTemplate,
  PROVIDER_TYPE_OPTIONS,
} from "@/constants/model-providers";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Globe, Key, Boxes, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProvider?: ModelProvider | null;
}

export function AddProviderDialog({
  open,
  onOpenChange,
  editProvider,
}: AddProviderDialogProps) {
  const addProvider = useModelStore((s) => s.addProvider);
  const updateProvider = useModelStore((s) => s.updateProvider);

  const [name, setName] = useState("");
  const [type, setType] = useState<ProviderType>("openai-compatible");
  const [apiHost, setApiHost] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiVersion, setApiVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [showKey, setShowKey] = useState(false);

  const isEdit = !!editProvider;

  useEffect(() => {
    if (editProvider) {
      setName(editProvider.name);
      setType(editProvider.type);
      setApiHost(editProvider.apiHost);
      setApiKey(editProvider.apiKey);
      setApiVersion(editProvider.apiVersion ?? "");
      setNotes(editProvider.notes ?? "");
    } else {
      resetForm();
    }
  }, [editProvider, open]);

  function resetForm() {
    setName("");
    setType("openai-compatible");
    setApiHost("");
    setApiKey("");
    setApiVersion("");
    setNotes("");
    setShowKey(false);
  }

  function handleSelectTemplate(templateId: string) {
    const tpl = BUILTIN_PROVIDER_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setName(tpl.name);
      setType(tpl.type);
      setApiHost(tpl.apiHost);
    }
  }

  function handleSubmit() {
    if (!name.trim()) return;

    if (isEdit && editProvider) {
      updateProvider({
        ...editProvider,
        name: name.trim(),
        type,
        apiHost: apiHost.trim(),
        apiKey: apiKey.trim(),
        apiVersion: apiVersion.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      const id = `custom-${Date.now()}`;
      // 检查是否选择了内置模板
      const tpl = BUILTIN_PROVIDER_TEMPLATES.find(
        (t) => t.name === name.trim() && t.apiHost === apiHost.trim(),
      );
      const models = tpl ? createProviderFromTemplate(tpl).models : [];

      addProvider({
        id,
        name: name.trim(),
        type,
        apiHost: apiHost.trim(),
        apiKey: apiKey.trim(),
        apiVersion: apiVersion.trim() || undefined,
        models,
        enabled: true,
        isSystem: false,
        notes: notes.trim() || undefined,
      });
    }

    onOpenChange(false);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        <div className="bg-muted/30 px-6 py-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            {isEdit ? "编辑服务商" : "添加模型服务商"}
          </DialogTitle>
          <DialogDescription className="mt-1.5">
            {isEdit
              ? "修改该模型服务商的连接配置信息。"
              : "配置一个新的 AI 模型服务商，以便在应用中使用其提供的模型。"}
          </DialogDescription>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-6">
          {/* 快速选择内置模板 */}
          {!isEdit && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                快速配置模板
                <Badge
                  variant="secondary"
                  className="font-normal text-[10px] px-1.5 h-4 bg-primary/10 text-primary"
                >
                  推荐
                </Badge>
              </label>
              <div className="flex flex-wrap gap-2">
                {BUILTIN_PROVIDER_TEMPLATES.slice(0, 10).map((tpl) => (
                  <Button
                    key={tpl.id}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    onClick={() => handleSelectTemplate(tpl.id)}
                  >
                    {tpl.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            {/* 名称 */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Boxes className="h-4 w-4 text-muted-foreground" />
                显示名称 <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：OpenAI, 硅基流动"
                className="text-sm bg-muted/20"
              />
            </div>

            {/* API 协议 */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                API 协议
              </label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ProviderType)}
              >
                <SelectTrigger className="text-sm bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPE_OPTIONS.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API 地址 */}
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                API 地址
              </label>
              <Input
                value={apiHost}
                onChange={(e) => setApiHost(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="text-sm bg-muted/20 font-mono"
              />
              <p className="text-[11px] text-muted-foreground ml-1">
                对于 OpenAI 兼容接口，通常以{" "}
                <code className="bg-muted px-1 rounded">/v1</code> 结尾。
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Key className="h-4 w-4 text-muted-foreground" />
                API 密钥
              </label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="text-sm pr-10 bg-muted/20 font-mono"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Azure API Version */}
            {type === "azure-openai" && (
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-foreground">
                  API 版本 (Azure 专属)
                </label>
                <Input
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  placeholder="2024-02-15-preview"
                  className="text-sm bg-muted/20"
                />
              </div>
            )}

            {/* 备注 */}
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-foreground">
                备注信息
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="（可选）一些备忘信息"
                className="text-sm bg-muted/20"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {isEdit ? "保存更改" : "确认添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
