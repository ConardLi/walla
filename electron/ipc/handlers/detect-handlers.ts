/**
 * Agent CLI 探测 IPC handler
 * 使用 `which` 命令检测本地是否安装了指定 CLI
 */

import { ipcMain } from "electron";
import { execFile } from "child_process";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";

export function registerDetectHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.AGENT_DETECT_CLI,
    async (_event, params: { commands: string[] }) => {
      const results: Record<string, boolean> = {};
      await Promise.all(
        params.commands.map(
          (cmd) =>
            new Promise<void>((resolve) => {
              execFile("which", [cmd], (err) => {
                results[cmd] = !err;
                resolve();
              });
            }),
        ),
      );
      return results;
    },
  );

  console.log("[IPC] Detect handlers registered");
}
