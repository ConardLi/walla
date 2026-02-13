/**
 * ACP 测试辅助模块
 *
 * 提供基于 ACP 协议的测试辅助函数：
 *   - 通过 stdio 传输启动 OpenCode Agent 子进程
 *   - 建立 ClientSideConnection
 *   - 提供断言和打印辅助
 *
 * 使用方式:
 *   tsx test/acp/01-initialize.ts
 *
 * 环境变量:
 *   OPENCODE_CMD  — opencode 可执行文件路径，默认 "opencode"
 */

import { spawn, type ChildProcess } from "node:child_process";
import { Writable, Readable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";

/**
 * 最简 Client 实现 — 收集所有 session/update 通知
 */
export class TestClient implements acp.Client {
  /** 收到的所有 session update 通知 */
  updates: acp.SessionNotification[] = [];
  /** 收到的所有权限请求 */
  permissionRequests: acp.RequestPermissionRequest[] = [];

  async sessionUpdate(params: acp.SessionNotification): Promise<void> {
    this.updates.push(params);
    const u = params.update;
    switch (u.sessionUpdate) {
      case "agent_message_chunk":
        if (u.content.type === "text") {
          process.stdout.write(u.content.text);
        } else {
          console.log(`  [${u.content.type}]`);
        }
        break;
      case "agent_thought_chunk":
        if (u.content.type === "text") {
          process.stdout.write(`  💭 ${u.content.text}`);
        }
        break;
      case "tool_call":
        console.log(`  🔧 工具调用: ${u.title} (${u.status})`);
        break;
      case "tool_call_update":
        console.log(`  🔧 工具更新: ${u.toolCallId} → ${u.status}`);
        break;
      case "plan":
        console.log(
          `  📋 计划: ${u.entries.map((e: any) => e.content).join(", ")}`,
        );
        break;
      case "current_mode_update":
        console.log(`  🔄 模式切换: ${u.currentModeId}`);
        break;
      case "config_option_update":
        console.log(`  ⚙️ 配置更新`);
        break;
      default:
        console.log(`  📨 ${u.sessionUpdate}`);
        break;
    }
  }

  async requestPermission(
    params: acp.RequestPermissionRequest,
  ): Promise<acp.RequestPermissionResponse> {
    this.permissionRequests.push(params);
    console.log(`  🔐 权限请求: ${params.toolCall.title}`);
    // 自动批准第一个选项
    const firstOption = params.options[0];
    if (firstOption) {
      console.log(`  ✅ 自动批准: ${firstOption.name}`);
      return {
        outcome: { outcome: "selected", optionId: firstOption.optionId },
      };
    }
    return { outcome: { outcome: "cancelled" } };
  }

  async readTextFile(
    params: acp.ReadTextFileRequest,
  ): Promise<acp.ReadTextFileResponse> {
    console.log(`  📖 读取文件: ${params.path}`);
    return { content: `[mock] 文件内容: ${params.path}` };
  }

  async writeTextFile(
    params: acp.WriteTextFileRequest,
  ): Promise<acp.WriteTextFileResponse> {
    console.log(`  📝 写入文件: ${params.path}`);
    return {};
  }
}

export interface ACPTestContext {
  connection: acp.ClientSideConnection;
  client: TestClient;
  process: ChildProcess;
  cleanup: () => void;
}

/**
 * 启动 OpenCode Agent（通过 stdio ACP 传输）并建立 ClientSideConnection
 */
export async function initACPAgent(): Promise<ACPTestContext> {
  const cmd = process.env.OPENCODE_CMD || "opencode";
  const args = process.env.OPENCODE_ARGS
    ? process.env.OPENCODE_ARGS.split(" ")
    : ["acp"];

  console.log(`📡 启动 ACP Agent: ${cmd} ${args.join(" ")}`);

  const agentProcess = spawn(cmd, args, {
    stdio: ["pipe", "pipe", "inherit"],
    cwd: process.cwd(),
  });

  // 等待进程启动
  await new Promise<void>((resolve, reject) => {
    agentProcess.on("error", (err) => {
      reject(new Error(`无法启动 Agent 进程 "${cmd}": ${err.message}`));
    });
    // 给进程一点时间启动
    setTimeout(resolve, 500);
  });

  if (agentProcess.exitCode !== null) {
    throw new Error(`Agent 进程立即退出，退出码: ${agentProcess.exitCode}`);
  }

  const input = Writable.toWeb(agentProcess.stdin!);
  const output = Readable.toWeb(
    agentProcess.stdout!,
  ) as ReadableStream<Uint8Array>;

  const testClient = new TestClient();
  const stream = acp.ndJsonStream(input, output);
  const connection = new acp.ClientSideConnection(
    (_agent) => testClient,
    stream,
  );

  const cleanup = () => {
    try {
      agentProcess.kill();
    } catch {
      // 忽略
    }
  };

  console.log(`✅ Agent 进程已启动 (PID: ${agentProcess.pid})`);

  return {
    connection,
    client: testClient,
    process: agentProcess,
    cleanup,
  };
}

/**
 * 通用断言
 */
export function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ 断言失败: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

/**
 * 打印结果
 */
export function printResult(label: string, data: unknown) {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
}
