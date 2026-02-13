"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  useAgentStore,
  selectStatus,
  selectAgentInfo,
} from "@/stores/agent-store";
import type { AgentConnection } from "@/types/agent";
import type { AgentFormPrefill } from "@/components/agent/agent-form-dialog";

export type ReconnectState = "idle" | "reconnecting" | "success" | "failed";

export type AgentFormData = Omit<
  AgentConnection,
  "id" | "createdAt" | "lastUsedAt"
>;

export function useAgentPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reconnectState, setReconnectState] = useState<ReconnectState>("idle");
  const [prefill, setPrefill] = useState<AgentFormPrefill | undefined>();

  const connections = useAgentStore((s) => s.connections);
  const activeConnectionId = useAgentStore((s) => s.activeConnectionId);
  const addConnection = useAgentStore((s) => s.addConnection);
  const reconnectAfterEdit = useAgentStore((s) => s.reconnectAfterEdit);
  const removeConnection = useAgentStore((s) => s.removeConnection);
  const setDefaultConnection = useAgentStore((s) => s.setDefaultConnection);
  const connectAgent = useAgentStore((s) => s.connectAgent);
  const disconnectAgent = useAgentStore((s) => s.disconnectAgent);
  const runtimeStates = useAgentStore((s) => s.runtimeStates);
  const status = useAgentStore(selectStatus);
  const agentInfo = useAgentStore(selectAgentInfo);
  const error = activeConnectionId
    ? (runtimeStates[activeConnectionId]?.error ?? null)
    : null;

  const editingConn = editingId
    ? connections.find((c) => c.id === editingId)
    : undefined;

  const detailConn = detailId
    ? (connections.find((c) => c.id === detailId) ?? null)
    : null;

  const openCreate = useCallback(() => {
    setEditingId(null);
    setPrefill(undefined);
    setDialogOpen(true);
  }, []);

  const openCreateWithPrefill = useCallback((data: AgentFormPrefill) => {
    setEditingId(null);
    setPrefill(data);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingId(id);
    setPrefill(undefined);
    setDialogOpen(true);
  }, []);

  const openDetail = useCallback((id: string) => {
    setDetailId(id);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailId(null);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
    setPrefill(undefined);
  }, []);

  const handleSave = useCallback(
    async (data: AgentFormData) => {
      const targetId = editingId;
      const agentName = data.name || "Agent";
      closeDialog();
      setReconnectState("reconnecting");

      try {
        let connId: string;
        if (targetId) {
          // 编辑：更新配置并重连（无论之前是否已连接）
          await reconnectAfterEdit(targetId, data);
          connId = targetId;
        } else {
          // 新增：添加后自动连接
          connId = await addConnection(data);
          await connectAgent(connId);
        }

        // 检查最终状态
        const rt = useAgentStore.getState().runtimeStates[connId];
        if (rt?.status === "ready") {
          setReconnectState("success");
          setTimeout(() => setReconnectState("idle"), 3000);
        } else {
          const errMsg = rt?.error || "连接失败";
          setReconnectState("failed");
          toast.error(`${agentName} 连接失败`, { description: errMsg });
        }
      } catch (err) {
        setReconnectState("failed");
        toast.error(`${agentName} 连接失败`, {
          description: (err as Error).message,
        });
      }
    },
    [editingId, reconnectAfterEdit, addConnection, connectAgent, closeDialog],
  );

  return {
    connections,
    activeConnectionId,
    status,
    agentInfo,
    error,
    reconnectState,
    dialogOpen,
    editingId,
    editingConn,
    detailConn,
    detailOpen: detailId !== null,
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
  };
}
