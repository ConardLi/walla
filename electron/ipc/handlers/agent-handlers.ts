/**
 * Agent 生命周期 IPC handlers: connect, disconnect, status
 */

import { ipcMain, type BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type { ACPManagerRegistry } from "../../services/acp";

type WindowGetter = () => BrowserWindow | null;

export function registerAgentHandlers(
  registry: ACPManagerRegistry,
  getWindow: WindowGetter,
): void {
  // agent:connect — 启动 Agent 进程并建立连接（需要 connectionId）
  ipcMain.handle(IPC_CHANNELS.AGENT_CONNECT, async (_event, params) => {
    const { connectionId, command, args, cwd, env } = params as {
      connectionId: string;
      command: string;
      args?: string[];
      cwd?: string;
      env?: Record<string, string>;
    };
    return registry.connect(connectionId, { command, args, cwd, env });
  });

  // agent:disconnect — 断开指定连接（需要 connectionId）
  ipcMain.handle(IPC_CHANNELS.AGENT_DISCONNECT, async (_event, params) => {
    const { connectionId } = (params ?? {}) as { connectionId?: string };
    if (connectionId) {
      await registry.disconnect(connectionId);
    } else {
      await registry.disconnectAll();
    }
    return { ok: true };
  });

  // agent:status — 查询所有连接状态
  ipcMain.handle(IPC_CHANNELS.AGENT_STATUS, async (_event, params) => {
    const { connectionId } = (params ?? {}) as { connectionId?: string };
    if (connectionId) {
      return registry.getStatus(connectionId);
    }
    return registry.getAllStatuses();
  });

  // 监听 Agent 状态变更，推送到渲染进程
  registry.events.on("agent:status-change", (info) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.EVENT_AGENT_STATUS_CHANGE, info);
    }
  });

  console.log("[IPC] Agent handlers registered");
}
