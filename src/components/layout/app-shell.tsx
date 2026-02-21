"use client";

import { useEffect, useState, useRef } from "react";
import { TitleBar } from "./title-bar";
import { NavBar } from "./nav-bar";
import { PageRouter } from "./page-router";
import { BootScreen } from "./boot-screen";
import type { BootPhase } from "@/types/nav";
import type { AgentConnection } from "@/types/agent";
import { initEventListeners } from "@/services/event-listener";
import { PermissionDialog } from "@/components/playground/permission-dialog";
import { OperationConfirmDialog } from "@/components/playground/operation-confirm-dialog";
import { GlobalLoadingDialog } from "@/components/ui/global-loading-dialog";
import { useAgentStore } from "@/stores/agent-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavStore } from "@/stores/nav-store";
import { useModelStore } from "@/stores/model-store";
import { toast } from "sonner";

export function AppShell() {
  const [booted, setBooted] = useState(false);
  const [bootPhase, setBootPhase] = useState<BootPhase>("loading");
  const [connectingAgents, setConnectingAgents] = useState<AgentConnection[]>(
    [],
  );
  const bootStarted = useRef(false);

  const loadConnections = useAgentStore((s) => s.loadConnections);
  const autoConnect = useAgentStore((s) => s.autoConnect);
  const connectionsLoaded = useAgentStore((s) => s.connectionsLoaded);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadSessionMetas = useSessionStore((s) => s.loadSessionMetas);
  const loadDirectories = useWorkspaceStore((s) => s.loadDirectories);
  const setActivePage = useNavStore((s) => s.setActivePage);
  const loadNavSettings = useNavStore((s) => s.loadNavSettings);
  const loadProviders = useModelStore((s) => s.loadProviders);

  // 初始化：加载所有配置
  useEffect(() => {
    initEventListeners();
    loadSettings();
    loadNavSettings();
    loadConnections();
    loadSessionMetas();
    loadDirectories();
    loadProviders();
  }, []);

  // 配置加载完成后执行启动流程
  useEffect(() => {
    if (!connectionsLoaded || bootStarted.current) return;
    bootStarted.current = true;

    const boot = async () => {
      const conns = useAgentStore.getState().connections;

      if (conns.length === 0) {
        // 无配置 → 跳转 Agent 页
        setBootPhase("no-agent");
        await delay(500);
        setActivePage("agent");
        setBooted(true);
        return;
      }

      // 找出将要连接的 Agent 名称列表
      const defaults = conns.filter((c) => c.isDefault);
      const toConnect = defaults.length > 0 ? defaults : [conns[0]];
      setConnectingAgents(toConnect);
      setBootPhase("connecting");

      const success = await autoConnect();

      if (success) {
        // 至少一个连接成功 → 跳转任务页
        setActivePage("task");
        setBooted(true);

        // 检查是否有部分连接失败
        const rts = useAgentStore.getState().runtimeStates;
        const failed = toConnect.filter((c) => rts[c.id]?.status === "error");
        for (const c of failed) {
          toast.error(`${c.name} 连接失败`, {
            description: rts[c.id]?.error || "连接失败",
          });
        }
      } else {
        // 全部失败 → 跳转 Agent 配置页
        const rts = useAgentStore.getState().runtimeStates;
        for (const c of toConnect) {
          const err = rts[c.id]?.error;
          if (err) {
            toast.error(`${c.name} 连接失败`, { description: err });
          }
        }
        setBootPhase("no-agent");
        await delay(500);
        setActivePage("agent");
        setBooted(true);
      }
    };

    boot();
  }, [connectionsLoaded]);

  // 启动阶段：展示 BootScreen
  if (!booted) {
    return <BootScreen phase={bootPhase} connectingAgents={connectingAgents} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <NavBar />
        <main className="flex-1 overflow-hidden bg-chat-background">
          <PageRouter />
        </main>
      </div>
      <PermissionDialog />
      <OperationConfirmDialog />
      <GlobalLoadingDialog />
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
