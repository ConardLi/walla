"use client";

import { useState } from "react";
import { useModelStore } from "@/stores/model-store";
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
import { Box, Tag, Key } from "lucide-react";

interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
}

export function AddModelDialog({
  open,
  onOpenChange,
  providerId,
}: AddModelDialogProps) {
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [group, setGroup] = useState("");
  const addModel = useModelStore((s) => s.addModel);

  const handleSubmit = () => {
    if (!modelId.trim()) return;
    addModel(providerId, {
      id: modelId.trim(),
      name: modelName.trim() || modelId.trim(),
      providerId,
      group: group.trim() || undefined,
      enabled: true,
    });
    setModelId("");
    setModelName("");
    setGroup("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">添加自定义模型</DialogTitle>
          <DialogDescription>
            添加一个在此服务商下可用的新模型。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Key className="h-4 w-4 text-muted-foreground" />
              模型 ID <span className="text-destructive">*</span>
            </label>
            <Input
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="如: gpt-4o, claude-3-5-sonnet-20241022"
              className="text-sm bg-muted/30"
              autoFocus
            />
            <p className="text-xs text-muted-foreground ml-1">
              调用 API 时实际使用的模型标识符，必须完全准确。
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
            <Input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="如: GPT-4, Claude 3 等"
              className="text-sm bg-muted/30"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!modelId.trim()}>
            确认添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
