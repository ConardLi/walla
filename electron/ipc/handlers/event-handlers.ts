/**
 * 事件转发 IPC handlers: session update → 渲染进程
 */

import type { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type { ACPManagerRegistry } from "../../services/acp";

type WindowGetter = () => BrowserWindow | null;

export function registerEventHandlers(
  registry: ACPManagerRegistry,
  getWindow: WindowGetter,
): void {
  // 监听会话更新事件，转发到渲染进程
  registry.events.on("session:update", (notification) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.EVENT_SESSION_UPDATE, notification);
    }
  });

  console.log("[IPC] Event handlers registered");
}
