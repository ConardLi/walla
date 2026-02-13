"use client";

import { useAgentPage } from "@/hooks/use-agent-page";
import { useAgentDetect } from "@/hooks/use-agent-detect";
import { AgentCard } from "./agent-card";
import { AgentCatalogCard } from "./agent-catalog-card";
import { AgentFormDialog } from "./agent-form-dialog";
import { AgentDetailDialog } from "./agent-detail-dialog";
import type { AgentDefinition } from "@/constants/agent";
import {
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export function AgentPage() {
  const {
    connections,
    activeConnectionId,
    error,
    reconnectState,
    dialogOpen,
    editingConn,
    detailConn,
    detailOpen,
    prefill,
    openCreate,
    openCreateWithPrefill,
    openEdit,
    closeDialog,
    openDetail,
    closeDetail,
    handleSave,
    connectAgent,
    disconnectAgent,
    runtimeStates,
    removeConnection,
    setDefaultConnection,
  } = useAgentPage();

  const {
    status: detectStatus,
    results: catalogAgents,
    refresh: refreshDetect,
  } = useAgentDetect();

  // 已添加的 agent id 集合（通过名称匹配常量）
  const addedAgentIds = new Set(
    connections
      .map((c) => {
        const match = catalogAgents.find(
          (ca) => ca.agent.name.toLowerCase() === c.name.toLowerCase(),
        );
        return match?.agent.id;
      })
      .filter(Boolean),
  );

  const handleCatalogConnect = (agent: AgentDefinition) => {
    openCreateWithPrefill({
      name: agent.name,
      command: agent.cli[0],
      args: agent.cli.slice(1).join(" "),
    });
  };

  const handleCatalogInstall = (agent: AgentDefinition) => {
    if (agent.npx) {
      openCreateWithPrefill({
        name: agent.name,
        command: agent.npx[0],
        args: agent.npx.slice(1).join(" "),
      });
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Agent 管理</h1>
            <p className="text-xs text-muted-foreground mt-1">
              管理和连接你的 AI Agent
            </p>
          </div>
        </div>

        {/* 重连状态提示 */}
        {reconnectState === "reconnecting" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-in fade-in">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              正在重新连接 Agent…
            </p>
          </div>
        )}
        {reconnectState === "success" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 animate-in fade-in">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-sm text-green-600 dark:text-green-400">
              Agent 重连成功，配置已更新
            </p>
          </div>
        )}
        {reconnectState === "failed" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in">
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              Agent 重连失败，配置已保存但连接未恢复
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && reconnectState === "idle" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* 已添加的 Agent */}
        {connections.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                已添加的 Agent
              </h2>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                自定义
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {connections.map((conn) => (
                <AgentCard
                  key={conn.id}
                  conn={conn}
                  isActive={activeConnectionId === conn.id}
                  runtimeState={runtimeStates[conn.id]}
                  onConnect={() =>
                    connectAgent(conn.id).catch((err) =>
                      toast.error(`${conn.name} 连接失败`, {
                        description: (err as Error).message,
                      }),
                    )
                  }
                  onDisconnect={() => disconnectAgent(conn.id)}
                  onEdit={() => openEdit(conn.id)}
                  onDelete={() => removeConnection(conn.id)}
                  onSetDefault={() => setDefaultConnection(conn.id)}
                  onViewDetail={() => openDetail(conn.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 所有 Agent 目录 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              支持的 Agent
            </h2>
            <div className="flex items-center gap-2">
              {detectStatus === "detecting" && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Search className="h-3 w-3 animate-pulse" />
                  探测中…
                </span>
              )}
              <button
                type="button"
                onClick={refreshDetect}
                disabled={detectStatus === "detecting"}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                title="重新探测"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catalogAgents.map(({ agent, available }) => (
              <AgentCatalogCard
                key={agent.id}
                agent={agent}
                available={available}
                added={addedAgentIds.has(agent.id)}
                onConnect={() => handleCatalogConnect(agent)}
                onInstall={() => handleCatalogInstall(agent)}
              />
            ))}
          </div>

          {/* 没有已添加 Agent 时也显示自定义按钮 */}
          {connections.length === 0 && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                自定义 Agent
              </button>
            </div>
          )}
        </section>
      </div>

      {/* 新建/编辑弹窗 */}
      <AgentFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        initial={editingConn}
        prefill={prefill}
        onSave={handleSave}
      />

      {/* 详情弹窗 */}
      <AgentDetailDialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
        conn={detailConn}
      />
    </div>
  );
}
