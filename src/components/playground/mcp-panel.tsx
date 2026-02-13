"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  FolderOpen,
  Loader2,
  Server,
  Globe,
  Terminal,
  Play,
} from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import {
  useAgentStore,
  selectAnyReady,
  selectAgentCapabilities,
} from "@/stores/agent-store";
import { isElectron, selectDirectory } from "@/services/ipc-client";
import type { McpServerConfig } from "@/shared/ipc-types";

type TransportType = "stdio" | "http" | "sse";

interface McpServerFormState {
  transport: TransportType;
  name: string;
  // stdio
  command: string;
  args: string;
  envPairs: Array<{ name: string; value: string }>;
  // http / sse
  url: string;
  headerPairs: Array<{ name: string; value: string }>;
}

function emptyForm(): McpServerFormState {
  return {
    transport: "stdio",
    name: "",
    command: "",
    args: "",
    envPairs: [],
    url: "",
    headerPairs: [],
  };
}

function formToConfig(form: McpServerFormState): McpServerConfig | null {
  if (!form.name.trim()) return null;

  if (form.transport === "stdio") {
    if (!form.command.trim()) return null;
    return {
      name: form.name.trim(),
      command: form.command.trim(),
      args: form.args
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean),
      env: form.envPairs.filter((e) => e.name.trim()),
    };
  }

  if (!form.url.trim()) return null;
  return {
    type: form.transport,
    name: form.name.trim(),
    url: form.url.trim(),
    headers: form.headerPairs.filter((h) => h.name.trim()),
  } as McpServerConfig;
}

export function McpPanel() {
  const [cwd, setCwd] = useState("");
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [form, setForm] = useState<McpServerFormState>(emptyForm());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useSessionStore((s) => s.createSession);
  const isReady = useAgentStore(selectAnyReady);
  const agentCapabilities = useAgentStore(selectAgentCapabilities);
  const mcpCaps = agentCapabilities?.mcpCapabilities as
    | { http?: boolean; sse?: boolean }
    | undefined;

  const addServer = () => {
    const config = formToConfig(form);
    if (!config) return;
    setServers((prev) => [...prev, config]);
    setForm(emptyForm());
  };

  const removeServer = (index: number) => {
    setServers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSession = async () => {
    if (!cwd.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      await createSession(cwd.trim(), {
        mcpServers: servers.length > 0 ? servers : undefined,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateForm = (patch: Partial<McpServerFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const getServerIcon = (server: McpServerConfig) => {
    if ("type" in server) {
      return server.type === "http" ? Globe : Globe;
    }
    return Terminal;
  };

  const getServerTransport = (server: McpServerConfig): string => {
    if ("type" in server) return server.type;
    return "stdio";
  };

  return (
    <div className="space-y-3">
      {/* Agent MCP 能力 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4" />
            MCP 能力
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default" className="text-xs">
              stdio ✓
            </Badge>
            <Badge
              variant={mcpCaps?.http ? "default" : "outline"}
              className="text-xs"
            >
              http {mcpCaps?.http ? "✓" : "✗"}
            </Badge>
            <Badge
              variant={mcpCaps?.sse ? "default" : "outline"}
              className="text-xs"
            >
              sse {mcpCaps?.sse ? "✓" : "✗"}
            </Badge>
          </div>
          {!isReady && (
            <p className="text-xs text-muted-foreground">
              请先连接 Agent 以查看 MCP 能力
            </p>
          )}
        </CardContent>
      </Card>

      {/* 添加 MCP Server */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加 MCP Server
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Transport 选择 */}
          <div className="flex gap-1">
            {(["stdio", "http", "sse"] as TransportType[]).map((t) => {
              const disabled =
                (t === "http" && !mcpCaps?.http) ||
                (t === "sse" && !mcpCaps?.sse);
              return (
                <Button
                  key={t}
                  size="sm"
                  variant={form.transport === t ? "default" : "outline"}
                  className="text-xs h-7 px-2"
                  disabled={disabled}
                  onClick={() => updateForm({ transport: t })}
                >
                  {t.toUpperCase()}
                </Button>
              );
            })}
          </div>

          {/* 名称 */}
          <Input
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="Server 名称 (如 filesystem)"
            className="text-xs"
          />

          {/* Stdio 字段 */}
          {form.transport === "stdio" && (
            <>
              <Input
                value={form.command}
                onChange={(e) => updateForm({ command: e.target.value })}
                placeholder="命令路径 (如 npx, /path/to/server)"
                className="text-xs font-mono"
              />
              <Input
                value={form.args}
                onChange={(e) => updateForm({ args: e.target.value })}
                placeholder="参数 (空格分隔, 如 -y @modelcontextprotocol/server-filesystem /tmp)"
                className="text-xs font-mono"
              />
              {/* 环境变量 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    环境变量
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 text-[10px] px-1"
                    onClick={() =>
                      updateForm({
                        envPairs: [...form.envPairs, { name: "", value: "" }],
                      })
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {form.envPairs.map((env, i) => (
                  <div key={i} className="flex gap-1">
                    <Input
                      value={env.name}
                      onChange={(e) => {
                        const next = [...form.envPairs];
                        next[i] = { ...next[i], name: e.target.value };
                        updateForm({ envPairs: next });
                      }}
                      placeholder="KEY"
                      className="text-xs font-mono flex-1"
                    />
                    <Input
                      value={env.value}
                      onChange={(e) => {
                        const next = [...form.envPairs];
                        next[i] = { ...next[i], value: e.target.value };
                        updateForm({ envPairs: next });
                      }}
                      placeholder="VALUE"
                      className="text-xs font-mono flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() =>
                        updateForm({
                          envPairs: form.envPairs.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* HTTP / SSE 字段 */}
          {(form.transport === "http" || form.transport === "sse") && (
            <>
              <Input
                value={form.url}
                onChange={(e) => updateForm({ url: e.target.value })}
                placeholder="URL (如 https://api.example.com/mcp)"
                className="text-xs font-mono"
              />
              {/* Headers */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    HTTP Headers
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 text-[10px] px-1"
                    onClick={() =>
                      updateForm({
                        headerPairs: [
                          ...form.headerPairs,
                          { name: "", value: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {form.headerPairs.map((h, i) => (
                  <div key={i} className="flex gap-1">
                    <Input
                      value={h.name}
                      onChange={(e) => {
                        const next = [...form.headerPairs];
                        next[i] = { ...next[i], name: e.target.value };
                        updateForm({ headerPairs: next });
                      }}
                      placeholder="Header Name"
                      className="text-xs font-mono flex-1"
                    />
                    <Input
                      value={h.value}
                      onChange={(e) => {
                        const next = [...form.headerPairs];
                        next[i] = { ...next[i], value: e.target.value };
                        updateForm({ headerPairs: next });
                      }}
                      placeholder="Header Value"
                      className="text-xs font-mono flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() =>
                        updateForm({
                          headerPairs: form.headerPairs.filter(
                            (_, j) => j !== i,
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={addServer}
            disabled={
              !form.name.trim() ||
              (form.transport === "stdio" && !form.command.trim()) ||
              (form.transport !== "stdio" && !form.url.trim())
            }
          >
            <Plus className="h-3 w-3" />
            添加到列表
          </Button>
        </CardContent>
      </Card>

      {/* 已添加的 MCP Servers */}
      {servers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              MCP Server 列表 ({servers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-3">
            {servers.map((server, index) => {
              const Icon = getServerIcon(server);
              const transport = getServerTransport(server);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md border text-xs"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium flex-1 truncate">
                    {server.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {transport}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => removeServer(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 创建会话 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="h-4 w-4" />
            创建带 MCP 的会话
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="工作目录路径"
              disabled={!isReady}
              className="flex-1"
            />
            {isElectron() && (
              <Button
                size="sm"
                variant="outline"
                disabled={!isReady}
                onClick={async () => {
                  const result = await selectDirectory();
                  if (result.path) setCwd(result.path);
                }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            将创建新会话并附带 {servers.length} 个 MCP Server
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleCreateSession}
            disabled={!isReady || !cwd.trim() || isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {isCreating ? "创建中..." : "创建会话"}
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
