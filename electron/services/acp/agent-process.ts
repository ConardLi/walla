/**
 * Agent 子进程生命周期管理
 *
 * 负责：
 *   - 通过 stdio 启动 Agent 子进程
 *   - 将 stdin/stdout 转为 Web Stream 供 SDK 使用
 *   - 管理进程的启动、监控、销毁
 */

import { spawn, type ChildProcess } from "node:child_process";
import { Writable, Readable } from "node:stream";
import type { AgentProcessConfig } from "./types";

export interface AgentProcessHandle {
  process: ChildProcess;
  inputStream: WritableStream;
  outputStream: ReadableStream<Uint8Array>;
}

/**
 * 启动 Agent 子进程并返回可用的流句柄
 */
export async function spawnAgentProcess(
  config: AgentProcessConfig,
): Promise<AgentProcessHandle> {
  const { command, args = [], cwd, env } = config;

  console.log(`[AgentProcess] Spawning: ${command} ${args.join(" ")}`);

  const mergedEnv = env ? { ...process.env, ...env } : process.env;

  const agentProcess = spawn(command, args, {
    stdio: ["pipe", "pipe", "inherit"],
    cwd: cwd ?? process.cwd(),
    env: mergedEnv,
  });

  // 等待进程启动（或快速失败）
  await new Promise<void>((resolve, reject) => {
    agentProcess.on("error", (err) => {
      reject(new Error(`无法启动 Agent 进程 "${command}": ${err.message}`));
    });
    setTimeout(resolve, 500);
  });

  if (agentProcess.exitCode !== null) {
    throw new Error(`Agent 进程立即退出，退出码: ${agentProcess.exitCode}`);
  }

  const inputStream = Writable.toWeb(agentProcess.stdin!);
  const outputStream = Readable.toWeb(
    agentProcess.stdout!,
  ) as ReadableStream<Uint8Array>;

  console.log(`[AgentProcess] Started (PID: ${agentProcess.pid})`);

  return { process: agentProcess, inputStream, outputStream };
}

/**
 * 安全销毁 Agent 子进程
 */
export function killAgentProcess(handle: AgentProcessHandle): void {
  try {
    if (handle.process.exitCode === null) {
      handle.process.kill();
      console.log(`[AgentProcess] Killed (PID: ${handle.process.pid})`);
    }
  } catch {
    // 忽略已退出的进程
  }
}
