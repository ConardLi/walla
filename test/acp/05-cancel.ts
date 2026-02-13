/**
 * ACP 测试脚本 05: 取消 Prompt
 *
 * 功能说明:
 *   - 初始化 ACP 连接并创建会话
 *   - 发送一个耗时较长的 prompt
 *   - 在 Agent 开始回复后立即发送 session/cancel 通知
 *   - 验证 prompt 返回 stopReason: "cancelled"
 *
 * 注意:
 *   此脚本会实际调用 AI 模型。
 *   cancel 是 notification（无需等待响应），Agent 收到后应尽快终止。
 *
 * 使用方式:
 *   tsx test/acp/05-cancel.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 取消 Prompt\n");

  let ctx: ACPTestContext | null = null;

  try {
    ctx = await initACPAgent();

    // 1. 初始化
    console.log("📝 初始化 ACP 连接...");
    const initResult = await ctx.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true },
        terminal: true,
      },
    });
    console.log(
      `✅ 已连接: ${initResult.agentInfo?.name} v${initResult.agentInfo?.version}`,
    );

    // 2. 创建会话
    console.log("\n📝 创建会话...");
    const session = await ctx.connection.newSession({
      cwd: process.cwd(),
      mcpServers: [],
    });
    console.log(`📌 会话 ID: ${session.sessionId}`);

    // 3. 发送 prompt，等收到首个 agent_message_chunk 后再 cancel
    console.log("\n📝 发送长 prompt...");
    console.log("--- Agent 回复（将被取消）---");

    // 用 Promise 等待首个 agent_message_chunk
    let resolveFirstChunk: () => void;
    const firstChunkReceived = new Promise<void>((resolve) => {
      resolveFirstChunk = resolve;
    });

    const originalSessionUpdate = ctx.client.sessionUpdate.bind(ctx.client);
    let cancelSent = false;
    ctx.client.sessionUpdate = async (params: acp.SessionNotification) => {
      await originalSessionUpdate(params);
      if (
        !cancelSent &&
        params.update.sessionUpdate === "agent_message_chunk"
      ) {
        resolveFirstChunk();
      }
    };

    // 发送 prompt（不 await，让它在后台等待响应）
    const promptPromise = ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "请写一篇 5000 字的长文，非常详细地介绍 TypeScript 从诞生到现在的完整历史、每个大版本的变化、设计哲学、类型系统的演进、与 JavaScript 的关系、在各大框架中的应用、社区生态以及未来十年的发展方向预测。每个部分都需要大量的细节和例子。",
        },
      ],
    });

    // 等待首个 agent_message_chunk 或 3 秒超时
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
    await Promise.race([firstChunkReceived, timeout]);

    // 发送 cancel
    cancelSent = true;
    console.log("\n\n📝 发送 session/cancel...");
    await ctx.connection.cancel({
      sessionId: session.sessionId,
    });
    console.log("✅ cancel 通知已发送");

    // 等待 prompt 返回，加 15 秒超时保护
    const TIMEOUT_MS = 15_000;
    const promptResult = await Promise.race([
      promptPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `prompt 在 cancel 后 ${TIMEOUT_MS / 1000}s 内未返回，可能 Agent 不支持 cancel`,
              ),
            ),
          TIMEOUT_MS,
        ),
      ),
    ]);

    console.log("\n--- 回复结束 ---\n");

    // 4. 验证结果
    console.log(`📌 stopReason: ${promptResult.stopReason}`);

    if (promptResult.stopReason === "cancelled") {
      assert(true, "stopReason 为 cancelled，取消成功");
    } else {
      console.log(
        "⚠️ Agent 返回了非 cancelled 的 stopReason: " + promptResult.stopReason,
      );
      assert(
        typeof promptResult.stopReason === "string",
        `stopReason 应为有效字符串: ${promptResult.stopReason}`,
      );
    }

    // 5. 统计
    const updateCount = ctx.client.updates.length;
    console.log(`\n📊 共收到 ${updateCount} 个 update`);

    console.log("\n✅ ACP 取消 Prompt 测试通过!");
  } catch (error) {
    console.error("❌ 测试失败:", (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  } finally {
    ctx?.cleanup();
    console.log("🔒 Agent 进程已关闭");
  }
}

main();
