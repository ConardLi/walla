/**
 * 会话管理 IPC handlers: initialize, new, load, list
 */

import type { BrowserWindow } from "electron";
import { ipcMain } from "electron";
import { spawn } from "node:child_process";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type { ACPManagerRegistry } from "../../services/acp";
import { extractErrorMessage } from "./error-utils";

type WindowGetter = () => BrowserWindow | null;

export function registerSessionHandlers(
  registry: ACPManagerRegistry,
  getWindow: WindowGetter,
): void {
  // acp:initialize — 发送 ACP 初始化握手（需要 connectionId）
  ipcMain.handle(IPC_CHANNELS.ACP_INITIALIZE, async (_event, params) => {
    const { connectionId } = params as { connectionId: string };
    return registry.initialize(connectionId);
  });

  // session:new — 创建新会话（需要 connectionId）
  ipcMain.handle(IPC_CHANNELS.SESSION_NEW, async (_event, params) => {
    const { connectionId, cwd, mcpServers } = params as {
      connectionId: string;
      cwd: string;
      mcpServers?: unknown[];
    };
    try {
      return await registry.newSession(connectionId, {
        cwd,
        mcpServers: (mcpServers as []) ?? [],
      });
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  });

  // acp:authenticate — 认证（需要 connectionId）
  ipcMain.handle(IPC_CHANNELS.AUTHENTICATE, async (_event, params) => {
    const { connectionId, methodId } = params as {
      connectionId: string;
      methodId: string;
    };
    try {
      const result = await registry.authenticate(connectionId, { methodId });
      return result;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  });

  // session:load — 加载已有会话（需要 connectionId）
  ipcMain.handle(IPC_CHANNELS.SESSION_LOAD, async (_event, params) => {
    const { connectionId, sessionId, cwd, mcpServers } = params as {
      connectionId: string;
      sessionId: string;
      cwd: string;
      mcpServers?: unknown[];
    };
    return registry.loadSession(connectionId, {
      sessionId,
      cwd,
      mcpServers: (mcpServers as []) ?? [],
    });
  });

  // session:list — 获取会话列表（需要 connectionId）
  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, async (_event, params) => {
    const { connectionId } = (params ?? {}) as { connectionId?: string };
    if (!connectionId) return { sessions: [] };
    try {
      return await registry.listSessions(connectionId, params ?? {});
    } catch {
      return { sessions: registry.getLocalSessions(connectionId) };
    }
  });

  // shell:exec — 执行终端命令（用于 terminal-auth 认证）
  // 保持子进程引用以支持 stdin 写入
  let activeChild: ReturnType<typeof spawn> | null = null;

  ipcMain.handle(IPC_CHANNELS.SHELL_EXEC, async (_event, params) => {
    const { command, args = [] } = params as {
      command: string;
      args?: string[];
    };
    return new Promise<{ exitCode: number; stdout: string; stderr: string }>(
      (resolve) => {
        const child = spawn(command, args, {
          stdio: ["pipe", "pipe", "pipe"],
          shell: false,
        });
        activeChild = child;

        let stdout = "";
        let stderr = "";

        const sendOutput = (text: string, stream: "stdout" | "stderr") => {
          const win = getWindow();
          if (win && !win.isDestroyed()) {
            win.webContents.send(IPC_CHANNELS.EVENT_SHELL_OUTPUT, {
              stream,
              data: text,
            });
          }
        };

        child.stdout?.on("data", (data: Buffer) => {
          const text = data.toString();
          stdout += text;
          sendOutput(text, "stdout");
        });
        child.stderr?.on("data", (data: Buffer) => {
          const text = data.toString();
          stderr += text;
          sendOutput(text, "stderr");
        });

        child.on("close", (code) => {
          activeChild = null;
          resolve({ exitCode: code ?? 1, stdout, stderr });
        });

        child.on("error", (err) => {
          activeChild = null;
          resolve({ exitCode: 1, stdout, stderr: err.message });
        });
      },
    );
  });

  // shell:write — 向正在执行的子进程 stdin 写入数据
  ipcMain.handle(IPC_CHANNELS.SHELL_WRITE, async (_event, params) => {
    const { data } = params as { data: string };
    if (activeChild && activeChild.stdin && !activeChild.stdin.destroyed) {
      activeChild.stdin.write(data);
      return { success: true };
    }
    return { success: false, error: "No active shell process" };
  });

  console.log("[IPC] Session handlers registered");
}
