/**
 * 系统级 IPC handlers: ping, app:get-version
 */

import { ipcMain, dialog } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";

export function registerSystemHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.PING, async () => {
    return { ok: true, timestamp: Date.now(), source: "electron-main" };
  });

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, async () => {
    const { app } = await import("electron");
    return { version: app.getVersion() };
  });

  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "选择工作目录",
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { path: null };
    }
    return { path: result.filePaths[0] };
  });

  console.log("[IPC] System handlers registered");
}
