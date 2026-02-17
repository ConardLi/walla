"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ServerForm, getDefaultFormData } from "./server-form";
import type { ServerFormData } from "./server-form";
import {
  parseMCPJson,
  formDataToJson,
  jsonToFormData,
} from "./use-json-parser";
import { EXAMPLE_JSON_STDIO, EXAMPLE_JSON_SSE } from "./constants";
import type { MCPServerConfig } from "@/types/mcp";
import type { RecommendedMCPServer } from "@/constants/recommended-mcp-servers";
import { useMCPStore } from "@/stores/mcp-store";

type TabMode = "form" | "json";

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editServer?: MCPServerConfig | null;
  recommendedServer?: RecommendedMCPServer | null;
}

export function AddServerDialog({
  open,
  onOpenChange,
  editServer,
  recommendedServer,
}: AddServerDialogProps) {
  const [tab, setTab] = useState<TabMode>("json");
  const [formData, setFormData] = useState<ServerFormData>(
    editServer ? configToFormData(editServer) : getDefaultFormData(),
  );
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const addServer = useMCPStore((s) => s.addServer);
  const updateServer = useMCPStore((s) => s.updateServer);

  const isEdit = !!editServer;
  const isRecommended = !!recommendedServer;

  // editServer/recommendedServer 或 open 变化时重新初始化
  useEffect(() => {
    if (open) {
      if (editServer) {
        const fd = configToFormData(editServer);
        setFormData(fd);
        setJsonInput(formDataToJson(fd));
        setTab("form");
      } else if (recommendedServer) {
        const fd = recommendedToFormData(recommendedServer);
        setFormData(fd);
        setJsonInput(formDataToJson(fd));
        setTab("form");
      } else {
        setFormData(getDefaultFormData());
        setJsonInput("");
        setTab("form");
      }
      setError(null);
      setConnecting(false);
    }
  }, [open, editServer, recommendedServer]);

  const resetState = useCallback(() => {
    setFormData(getDefaultFormData());
    setJsonInput("");
    setError(null);
    setConnecting(false);
    setTab("form");
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) resetState();
      onOpenChange(v);
    },
    [onOpenChange, resetState],
  );

  const handleSubmit = useCallback(async () => {
    setError(null);
    setConnecting(true);

    try {
      let config: MCPServerConfig;

      if (tab === "json") {
        const result = parseMCPJson(jsonInput);
        if (!result.success || result.servers.length === 0) {
          setError(result.error ?? "JSON 解析失败");
          setConnecting(false);
          return;
        }

        // 检查 JSON 是否有未替换的变量
        const placeholderRegex = /\$\{[^}]+\}/g;
        const jsonStr = jsonInput;
        const unreplacedVars = jsonStr.match(placeholderRegex);
        if (unreplacedVars) {
          setError(
            `请替换未填写的变量：${[...new Set(unreplacedVars)].join(", ")}`,
          );
          setConnecting(false);
          return;
        }

        const s = result.servers[0];
        config = {
          id:
            editServer?.id ??
            (recommendedServer
              ? `${recommendedServer.id}-${Date.now()}`
              : `mcp-${Date.now()}`),
          name: s.name,
          description: s.description,
          transportType: s.transportType,
          command: s.command,
          args: s.args,
          env: s.env,
          url: s.url,
          createdAt: editServer?.createdAt ?? Date.now(),
        };
      } else {
        if (!formData.name.trim()) {
          setError("请输入名称");
          setConnecting(false);
          return;
        }
        if (formData.transportType === "stdio" && !formData.command.trim()) {
          setError("Stdio 模式需要指定命令");
          setConnecting(false);
          return;
        }
        if (formData.transportType === "sse" && !formData.url.trim()) {
          setError("SSE 模式需要指定 URL");
          setConnecting(false);
          return;
        }

        // 检查推荐 Server 是否有未替换的变量
        if (recommendedServer) {
          const unreplacedVars: string[] = [];
          const placeholderRegex = /\$\{[^}]+\}/g;

          if (formData.command.trim()) {
            const matches = formData.command.trim().match(placeholderRegex);
            if (matches) unreplacedVars.push(...matches);
          }
          if (formData.url.trim()) {
            const matches = formData.url.trim().match(placeholderRegex);
            if (matches) unreplacedVars.push(...matches);
          }
          for (const pair of formData.env) {
            if (pair.value) {
              const matches = pair.value.match(placeholderRegex);
              if (matches) unreplacedVars.push(...matches);
            }
          }

          if (unreplacedVars.length > 0) {
            setError(
              `请替换未填写的变量：${[...new Set(unreplacedVars)].join(", ")}`,
            );
            setConnecting(false);
            return;
          }
        }

        const env: Record<string, string> = {};
        for (const pair of formData.env) {
          if (pair.key.trim()) {
            env[pair.key.trim()] = pair.value;
          }
        }

        config = {
          id:
            editServer?.id ??
            (recommendedServer
              ? `${recommendedServer.id}-${Date.now()}`
              : `mcp-${Date.now()}`),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          icon: editServer?.icon ?? recommendedServer?.icon ?? undefined,
          transportType: formData.transportType,
          command:
            formData.transportType === "stdio"
              ? formData.command.trim()
              : undefined,
          args:
            formData.transportType === "stdio" && formData.args.length > 0
              ? formData.args
              : undefined,
          env:
            formData.transportType === "stdio" && Object.keys(env).length > 0
              ? env
              : undefined,
          url:
            formData.transportType === "sse" ? formData.url.trim() : undefined,
          createdAt: editServer?.createdAt ?? Date.now(),
        };
      }

      const result = isEdit
        ? await updateServer(config)
        : await addServer(config);

      if (!result.success) {
        setError(result.error ?? "连接失败");
        setConnecting(false);
        return;
      }

      setConnecting(false);
      handleOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
      setConnecting(false);
    }
  }, [
    tab,
    recommendedServer,
    jsonInput,
    formData,
    editServer,
    isEdit,
    addServer,
    updateServer,
    handleOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "编辑 MCP Server"
              : isRecommended
                ? `添加推荐 Server: ${recommendedServer.name}`
                : "添加 MCP Server"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改配置后将重新连接"
              : isRecommended
                ? "配置已预填，请检查并填写必需参数（标记 ${YOUR_XXX} 的字段）"
                : "添加后将自动尝试连接，连接成功后保存配置"}
          </DialogDescription>
        </DialogHeader>

        {/* Tab 切换 */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => {
              // 切换到表单时，将 JSON 数据同步到表单
              if (jsonInput.trim()) {
                const parsed = jsonToFormData(jsonInput);
                if (parsed) setFormData(parsed);
              }
              setTab("form");
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
              tab === "form"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            表单填写
          </button>
          <button
            onClick={() => {
              // 切换到 JSON 时，将表单数据同步到 JSON
              setJsonInput(formDataToJson(formData));
              setTab("json");
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
              tab === "json"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            JSON 配置
          </button>
        </div>

        {/* 内容区 */}
        <div className="py-2 min-h-[300px]">
          {tab === "json" ? (
            <div className="space-y-4">
              <div className="relative group">
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="粘贴 MCP Server JSON 配置..."
                  className="font-mono text-xs h-[300px] max-h-[400px] overflow-y-auto whitespace-pre-wrap break-all resize-none bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-3 pt-2">
                <p className="font-medium">Stdio 示例：</p>
                <pre className="bg-muted/50 rounded p-2 overflow-auto text-[11px]">
                  {EXAMPLE_JSON_STDIO}
                </pre>
                <p className="font-medium">SSE 示例：</p>
                <pre className="bg-muted/50 rounded p-2 overflow-auto text-[11px]">
                  {EXAMPLE_JSON_SSE}
                </pre>
              </div>
            </div>
          ) : (
            <ServerForm data={formData} onChange={setFormData} />
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={connecting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={connecting}>
            {connecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {connecting ? "正在连接..." : isEdit ? "保存并重连" : "连接并添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function configToFormData(config: MCPServerConfig): ServerFormData {
  return {
    name: config.name,
    description: config.description ?? "",
    transportType: config.transportType,
    command: config.command ?? "",
    args: config.args ?? [],
    env: config.env
      ? Object.entries(config.env).map(([key, value]) => ({ key, value }))
      : [],
    url: config.url ?? "",
  };
}

function recommendedToFormData(
  recommended: RecommendedMCPServer,
): ServerFormData {
  return {
    name: recommended.name,
    description: recommended.description,
    transportType: recommended.transportType,
    command: recommended.command ?? "",
    args: recommended.args ?? [],
    env: recommended.env
      ? Object.entries(recommended.env).map(([key, value]) => ({ key, value }))
      : [],
    url: recommended.url ?? "",
  };
}
