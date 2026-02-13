/**
 * MCP Server IPC handlers
 */

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type { MCPClientManager } from "../../services/mcp";
import type { MCPServerConfig } from "../../../src/types/mcp";

export function registerMCPHandlers(mcpManager: MCPClientManager): void {
  // mcp:connect — 连接到 MCP Server
  ipcMain.handle(IPC_CHANNELS.MCP_CONNECT, async (_event, params) => {
    const { config } = params as { config: MCPServerConfig };
    return await mcpManager.connect(config);
  });

  // mcp:disconnect — 断开 MCP Server
  ipcMain.handle(IPC_CHANNELS.MCP_DISCONNECT, async (_event, params) => {
    const { serverId } = params as { serverId: string };
    await mcpManager.disconnect(serverId);
    return { ok: true };
  });

  // mcp:refresh — 刷新 MCP Server 的工具/提示词/资源列表
  ipcMain.handle(IPC_CHANNELS.MCP_REFRESH, async (_event, params) => {
    const { serverId } = params as { serverId: string };
    return await mcpManager.refresh(serverId);
  });

  // mcp:disconnect-all — 断开所有 MCP Server
  ipcMain.handle(IPC_CHANNELS.MCP_DISCONNECT_ALL, async () => {
    await mcpManager.disconnectAll();
    return { ok: true };
  });

  console.log("[IPC] MCP handlers registered");
}
