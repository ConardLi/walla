/**
 * Prompt IPC handlers: prompt, cancel
 */

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type { ACPManagerRegistry } from "../../services/acp";
import { extractErrorMessage } from "./error-utils";

export function registerPromptHandlers(registry: ACPManagerRegistry): void {
  // session:prompt — 发送 prompt（通过 sessionId 路由）
  ipcMain.handle(IPC_CHANNELS.SESSION_PROMPT, async (_event, params) => {
    const { sessionId, prompt } = params as {
      sessionId: string;
      prompt: unknown[];
    };
    try {
      return await registry.prompt(sessionId, {
        sessionId,
        prompt: prompt as never,
      });
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  });

  // session:cancel — 取消正在进行的 prompt（通过 sessionId 路由）
  ipcMain.handle(IPC_CHANNELS.SESSION_CANCEL, async (_event, params) => {
    const { sessionId } = params as { sessionId: string };
    await registry.cancel(sessionId, { sessionId });
    return { ok: true };
  });

  console.log("[IPC] Prompt handlers registered");
}
