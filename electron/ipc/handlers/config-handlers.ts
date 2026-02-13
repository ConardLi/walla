/**
 * 配置相关 IPC handlers: set-mode, set-config
 */

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type { ACPManagerRegistry } from "../../services/acp";

export function registerConfigHandlers(registry: ACPManagerRegistry): void {
  // session:set-mode — 切换会话模式（通过 sessionId 路由）
  ipcMain.handle(IPC_CHANNELS.SESSION_SET_MODE, async (_event, params) => {
    const { sessionId, modeId } = params as {
      sessionId: string;
      modeId: string;
    };
    return registry.setSessionMode(sessionId, { sessionId, modeId });
  });

  // session:set-model — 切换会话模型（通过 sessionId 路由）
  ipcMain.handle(IPC_CHANNELS.SESSION_SET_MODEL, async (_event, params) => {
    const { sessionId, modelId } = params as {
      sessionId: string;
      modelId: string;
    };
    return registry.setSessionModel(sessionId, { sessionId, modelId });
  });

  // session:set-config — 设置会话配置选项（通过 sessionId 路由）
  ipcMain.handle(IPC_CHANNELS.SESSION_SET_CONFIG, async (_event, params) => {
    const { sessionId, configId, value } = params as {
      sessionId: string;
      configId: string;
      value: string;
    };
    return registry.setSessionConfigOption(sessionId, {
      sessionId,
      configId,
      value,
    });
  });

  console.log("[IPC] Config handlers registered");
}
