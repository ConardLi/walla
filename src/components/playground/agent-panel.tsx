"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plug,
  Unplug,
  Zap,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  useAgentStore,
  selectStatus,
  selectAgentInfo,
  selectAgentCapabilities,
} from "@/stores/agent-store";
import * as ipc from "@/services/ipc-client";

export function AgentPanel() {
  const [command, setCommand] = useState("npx");
  const [args, setArgs] = useState("-y opencode-ai acp");
  const [envPairs, setEnvPairs] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const status = useAgentStore(selectStatus);
  const agentInfo = useAgentStore(selectAgentInfo);
  const agentCapabilities = useAgentStore(selectAgentCapabilities);
  const activeConnectionId = useAgentStore((s) => s.activeConnectionId);
  const runtimeStates = useAgentStore((s) => s.runtimeStates);
  const addConnection = useAgentStore((s) => s.addConnection);
  const connectAgent = useAgentStore((s) => s.connectAgent);
  const disconnectAll = useAgentStore((s) => s.disconnectAll);
  const activeRuntime = activeConnectionId
    ? runtimeStates[activeConnectionId]
    : undefined;
  const authMethods = activeRuntime?.authMethods ?? [];
  const error = activeRuntime?.error ?? null;

  const [approvalMode, setApprovalMode] = useState<"auto" | "manual">("auto");

  useEffect(() => {
    ipc
      .storageGet({ namespace: "settings", key: "approvalMode" })
      .then((res) => {
        if (res.value === "manual") setApprovalMode("manual");
      })
      .catch(() => {});
  }, []);

  const toggleApprovalMode = useCallback(async () => {
    const next = approvalMode === "auto" ? "manual" : "auto";
    setApprovalMode(next);
    await ipc.storageSet({
      namespace: "settings",
      key: "approvalMode",
      value: next,
    });
  }, [approvalMode]);

  const isConnecting = status === "connecting" || status === "initializing";
  const canConnect = status === "disconnected" || status === "error";
  const canDisconnect = status !== "disconnected";

  const handleConnect = async () => {
    const env: Record<string, string> = {};
    for (const pair of envPairs) {
      if (pair.key.trim()) {
        env[pair.key.trim()] = pair.value;
      }
    }
    const hasEnv = Object.keys(env).length > 0;
    // 创建临时连接配置并连接
    await addConnection({
      name: command,
      command,
      args: args ? args.split(/\s+/) : [],
      env: hasEnv ? env : undefined,
      approvalMode: approvalMode === "manual" ? "manual" : "auto",
    });
    const conns = useAgentStore.getState().connections;
    const lastConn = conns[conns.length - 1];
    if (lastConn) {
      await connectAgent(lastConn.id);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Agent 连接
          </CardTitle>
          <CardDescription>配置并连接到本地 ACP Agent 进程</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent 命令</label>
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="例如: opencode"
              disabled={!canConnect}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">启动参数</label>
            <Input
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="例如: acp"
              disabled={!canConnect}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">环境变量</label>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                disabled={!canConnect}
                onClick={() =>
                  setEnvPairs((prev) => [...prev, { key: "", value: "" }])
                }
              >
                <Plus className="h-3 w-3" />
                添加
              </Button>
            </div>
            {envPairs.map((pair, i) => (
              <div key={i} className="flex gap-1.5">
                <Input
                  value={pair.key}
                  onChange={(e) => {
                    const next = [...envPairs];
                    next[i] = { ...next[i], key: e.target.value };
                    setEnvPairs(next);
                  }}
                  placeholder="KEY"
                  className="flex-1 font-mono text-xs"
                  disabled={!canConnect}
                />
                <Input
                  value={pair.value}
                  onChange={(e) => {
                    const next = [...envPairs];
                    next[i] = { ...next[i], value: e.target.value };
                    setEnvPairs(next);
                  }}
                  placeholder="VALUE"
                  className="flex-1 font-mono text-xs"
                  disabled={!canConnect}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 shrink-0"
                  disabled={!canConnect}
                  onClick={() =>
                    setEnvPairs((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {envPairs.length === 0 && (
              <p className="text-xs text-muted-foreground">
                可选：为 Agent 进程追加环境变量（如 API_KEY 等）
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleConnect}
              disabled={!canConnect || isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plug className="h-4 w-4" />
              )}
              {isConnecting ? "连接中..." : "连接 Agent"}
            </Button>
            <Button
              variant="outline"
              onClick={disconnectAll}
              disabled={!canDisconnect}
            >
              <Unplug className="h-4 w-4" />
              断开
            </Button>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {agentInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Agent 信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">名称</span>
              <span className="font-medium">{agentInfo.name}</span>
              <span className="text-muted-foreground">版本</span>
              <span className="font-medium">{agentInfo.version}</span>
              {agentInfo.title && (
                <>
                  <span className="text-muted-foreground">标题</span>
                  <span className="font-medium">{agentInfo.title}</span>
                </>
              )}
            </div>

            {agentCapabilities && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">能力</span>
                <div className="flex flex-wrap gap-1">
                  {agentCapabilities.loadSession && (
                    <Badge variant="secondary">loadSession</Badge>
                  )}
                  {!!agentCapabilities.promptCapabilities && (
                    <Badge variant="secondary">prompt</Badge>
                  )}
                  {!!agentCapabilities.mcpCapabilities && (
                    <Badge variant="secondary">MCP</Badge>
                  )}
                  {!!agentCapabilities.sessionCapabilities && (
                    <Badge variant="secondary">session</Badge>
                  )}
                </div>
              </div>
            )}

            {authMethods.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">认证方法</span>
                <div className="flex flex-wrap gap-1">
                  {authMethods.map((m) => (
                    <Badge key={m.id} variant="outline">
                      {m.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* 授权模式 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {approvalMode === "auto" ? (
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            )}
            工具执行授权
          </CardTitle>
          <CardDescription>
            控制 Agent 执行文件读写、终端命令等操作时是否需要用户确认
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">
                当前模式：{approvalMode === "auto" ? "自动执行" : "手动确认"}
              </div>
              <div className="text-xs text-muted-foreground">
                {approvalMode === "auto"
                  ? "Agent 的所有操作将自动执行，无需用户确认"
                  : "Agent 执行敏感操作前会弹窗询问，用户批准后才继续"}
              </div>
            </div>
            <Button
              variant={approvalMode === "auto" ? "outline" : "default"}
              size="sm"
              onClick={toggleApprovalMode}
            >
              {approvalMode === "auto" ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  切换为手动
                </>
              ) : (
                <>
                  <ShieldOff className="h-3.5 w-3.5 mr-1" />
                  切换为自动
                </>
              )}
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <p>手动确认模式下拦截的操作：</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                readTextFile
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                writeTextFile
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                createTerminal
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
