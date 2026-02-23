"use client";

import { useState, useEffect, useMemo } from "react";
import { useModelStore } from "@/stores/model-store";
import type { Model, ProviderType } from "@/types/model";
import { PROVIDER_TYPE_OPTIONS } from "@/constants/model-providers";
import * as ipc from "@/services/ipc-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Combobox } from "@/components/ui/combobox";
import { Box, Tag, Key, Network } from "lucide-react";

interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerType: ProviderType;
  editModel?: Model;
}

export function AddModelDialog({
  open,
  onOpenChange,
  providerId,
  providerType,
  editModel,
}: AddModelDialogProps) {
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [group, setGroup] = useState("");
  const [modelType, setModelType] = useState<ProviderType | "default">(
    "default",
  );
  const [modelOptions, setModelOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const addModel = useModelStore((s) => s.addModel);
  const updateModel = useModelStore((s) => s.updateModel);
  const providers = useModelStore((s) => s.providers);

  const isEdit = !!editModel;

  const groupOptions = useMemo(() => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return [];
    const groups = new Set<string>();
    provider.models.forEach((m) => {
      if (m.group) groups.add(m.group);
    });
    return Array.from(groups)
      .sort()
      .map((g) => ({ value: g, label: g }));
  }, [providers, providerId]);

  useEffect(() => {
    if (open) {
      if (editModel) {
        setModelId(editModel.id);
        setModelName(editModel.name);
        setGroup(editModel.group || "");
        setModelType(editModel.type || "default");
      } else {
        setModelId("");
        setModelName("");
        setGroup("");
        setModelType("default");
      }

      // 获取模型列表
      fetchModelList();
    }
  }, [open, editModel]);

  const fetchModelList = async () => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;

    setLoadingModels(true);
    try {
      const response = await ipc.llmFetchModels({
        type: provider.type,
        apiKey: provider.apiKey,
        baseURL: provider.apiHost,
      });

      const options = response.models.map((m) => ({
        value: m.id,
        label: m.name || m.id,
      }));
      setModelOptions(options);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setModelOptions([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSubmit = () => {
    if (!modelId.trim()) return;

    if (isEdit && editModel) {
      updateModel(providerId, editModel.id, {
        id: modelId.trim(),
        name: modelName.trim() || modelId.trim(),
        group: group.trim() || undefined,
        type: modelType === "default" ? undefined : modelType,
      });
    } else {
      addModel(providerId, {
        id: modelId.trim(),
        name: modelName.trim() || modelId.trim(),
        providerId,
        group: group.trim() || undefined,
        enabled: true,
        type: modelType === "default" ? undefined : modelType,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? "编辑模型" : "添加自定义模型"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改模型的配置信息。"
              : "添加一个在此服务商下可用的新模型。"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Key className="h-4 w-4 text-muted-foreground" />
              模型 ID <span className="text-destructive">*</span>
            </label>
            <Combobox
              value={modelId}
              onChange={setModelId}
              options={modelOptions}
              placeholder={loadingModels ? "加载中..." : "选择或输入模型 ID"}
              emptyText="未找到模型，请手动输入"
              className="text-sm"
              disabled={isEdit || loadingModels}
            />
            <p className="text-xs text-muted-foreground ml-1">
              {loadingModels
                ? "正在从服务商获取可用模型列表..."
                : "调用 API 时实际使用的模型标识符，必须完全准确。"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Box className="h-4 w-4 text-muted-foreground" />
              显示名称
            </label>
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="留空则默认使用模型 ID"
              className="text-sm bg-muted/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-muted-foreground" />
              分组
            </label>
            <Combobox
              value={group}
              onChange={setGroup}
              options={groupOptions}
              placeholder="选择或输入分组名称"
              emptyText="暂无分组，请输入新分组名"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Network className="h-4 w-4 text-muted-foreground" />
              API 协议
            </label>
            <Select
              value={modelType}
              onValueChange={(v) => setModelType(v as ProviderType | "default")}
            >
              <SelectTrigger className="text-sm bg-muted/30">
                <SelectValue placeholder="选择 API 协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  默认（使用提供商协议:{" "}
                  {PROVIDER_TYPE_OPTIONS.find((o) => o.value === providerType)
                    ?.label || providerType}
                  ）
                </SelectItem>
                {PROVIDER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground ml-1">
              选择此模型使用的 API 协议，默认使用提供商的协议。
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!modelId.trim()}>
            {isEdit ? "保存修改" : "确认添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
