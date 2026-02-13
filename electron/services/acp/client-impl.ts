/**
 * ACP Client 接口实现
 *
 * 处理 Agent → Client 方向的回调：
 *   - sessionUpdate: 接收会话流式更新
 *   - requestPermission: 处理权限请求（转发给渲染进程）
 *   - readTextFile / writeTextFile: 文件系统操作
 *   - createTerminal / terminalOutput / releaseTerminal / waitForTerminalExit / killTerminal: 终端操作
 */

import { spawn, type ChildProcess } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type * as acp from "@agentclientprotocol/sdk";
import type { ACPEventEmitter } from "./event-emitter";

// ============ 终端存储 ============

interface TerminalEntry {
  process: ChildProcess;
  output: string;
  exitCode: number | null;
  exitSignal: string | null;
}

const terminalStore = new Map<string, TerminalEntry>();

/**
 * 清理所有终端（在 Agent 断开时调用）
 */
export function cleanupAllTerminals(): void {
  for (const [, entry] of terminalStore) {
    try {
      entry.process.kill();
    } catch {
      // 忽略
    }
  }
  terminalStore.clear();
}

/**
 * 创建 ACP Client 实例
 *
 * 该 Client 将 Agent 的回调通过事件总线转发，
 * 由上层（IPC handlers）监听并推送到渲染进程
 */
export function createACPClient(emitter: ACPEventEmitter): acp.Client {
  return {
    async sessionUpdate(params: acp.SessionNotification): Promise<void> {
      emitter.emit("session:update", params);
    },

    async requestPermission(
      params: acp.RequestPermissionRequest,
    ): Promise<acp.RequestPermissionResponse> {
      return new Promise<acp.RequestPermissionResponse>((resolve) => {
        emitter.emit("permission:request", { request: params, resolve });
      });
    },

    async readTextFile(
      params: acp.ReadTextFileRequest,
    ): Promise<acp.ReadTextFileResponse> {
      console.log(`[ACPClient] readTextFile: ${params.path}`);
      try {
        const content = await fs.readFile(params.path, "utf-8");
        return { content };
      } catch (err) {
        console.error(`[ACPClient] readTextFile error:`, err);
        return { content: `Error reading file: ${(err as Error).message}` };
      }
    },

    async writeTextFile(
      params: acp.WriteTextFileRequest,
    ): Promise<acp.WriteTextFileResponse> {
      console.log(`[ACPClient] writeTextFile: ${params.path}`);
      try {
        await fs.mkdir(path.dirname(params.path), { recursive: true });
        await fs.writeFile(params.path, params.content, "utf-8");
        return {};
      } catch (err) {
        console.error(`[ACPClient] writeTextFile error:`, err);
        throw err;
      }
    },

    async createTerminal(
      params: acp.CreateTerminalRequest,
    ): Promise<acp.CreateTerminalResponse> {
      console.log(
        `[ACPClient] createTerminal: ${params.command} ${(params.args ?? []).join(" ")}`,
      );
      const terminalId = `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const env: Record<string, string> = {};
      for (const [k, v] of Object.entries(process.env)) {
        if (v !== undefined) env[k] = v;
      }
      if (params.env) {
        for (const envVar of params.env) {
          env[envVar.name] = envVar.value;
        }
      }

      const proc = spawn(params.command, params.args ?? [], {
        cwd: params.cwd ?? process.cwd(),
        env,
        shell: true,
      });

      const entry: TerminalEntry = {
        process: proc,
        output: "",
        exitCode: null,
        exitSignal: null,
      };
      terminalStore.set(terminalId, entry);

      proc.stdout?.on("data", (chunk: Buffer) => {
        entry.output += chunk.toString();
      });

      proc.stderr?.on("data", (chunk: Buffer) => {
        entry.output += chunk.toString();
      });

      proc.on("exit", (code: number | null, signal: string | null) => {
        entry.exitCode = code;
        entry.exitSignal = signal;
      });

      return { terminalId };
    },

    async terminalOutput(
      params: acp.TerminalOutputRequest,
    ): Promise<acp.TerminalOutputResponse> {
      const entry = terminalStore.get(params.terminalId);
      if (!entry) {
        return { output: "", truncated: false };
      }
      const response: acp.TerminalOutputResponse = {
        output: entry.output,
        truncated: false,
      };
      if (entry.exitCode !== null) {
        response.exitStatus = { exitCode: entry.exitCode };
      }
      return response;
    },

    async waitForTerminalExit(
      params: acp.WaitForTerminalExitRequest,
    ): Promise<acp.WaitForTerminalExitResponse> {
      const entry = terminalStore.get(params.terminalId);
      if (!entry) {
        return { exitCode: -1 };
      }
      if (entry.exitCode !== null) {
        return { exitCode: entry.exitCode };
      }
      return new Promise((resolve) => {
        entry.process.on("exit", (code: number | null) => {
          resolve({ exitCode: code ?? -1 });
        });
      });
    },

    async releaseTerminal(params: acp.ReleaseTerminalRequest): Promise<void> {
      const entry = terminalStore.get(params.terminalId);
      if (entry) {
        try {
          entry.process.kill();
        } catch {
          // 忽略
        }
        terminalStore.delete(params.terminalId);
      }
    },

    async killTerminal(params: acp.KillTerminalCommandRequest): Promise<void> {
      const entry = terminalStore.get(params.terminalId);
      if (entry) {
        try {
          entry.process.kill();
        } catch {
          // 忽略
        }
      }
    },
  };
}
