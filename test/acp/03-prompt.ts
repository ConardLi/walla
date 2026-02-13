/**
 * ACP 测试脚本 03: Prompt 与流式输出
 *
 * 功能说明:
 *   - 初始化 ACP 连接并创建会话
 *   - 发送 session/prompt 请求
 *   - 通过 TestClient.sessionUpdate 回调接收流式 session/update 通知
 *   - 验证收到 agent_message_chunk 和最终的 stopReason
 *   - 打印收到的所有 update 类型统计
 *
 * 注意:
 *   此脚本会实际调用 AI 模型，请确保 Agent 配置了可用模型和 API Key。
 *
 * 使用方式:
 *   tsx test/acp/03-prompt.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, printResult, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP Prompt 与流式输出\n");

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
    console.log(`✅ 已连接: ${initResult.agentInfo?.name} v${initResult.agentInfo?.version}`);

    // 2. 创建会话
    console.log("\n📝 创建会话...");
    const session = await ctx.connection.newSession({
      cwd: process.cwd(),
      mcpServers: [],
    });
    console.log(`📌 会话 ID: ${session.sessionId}`);

    // 3. 发送简单 prompt
    console.log("\n📝 发送 prompt: '你好！请用一句话介绍你自己。'\n");
    console.log("--- Agent 回复 ---");

    const promptResult = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "你好！请用一句话介绍你自己。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---\n");

    // 4. 验证 stopReason
    printResult("Prompt 响应", promptResult);
    assert(
      typeof promptResult.stopReason === "string",
      `stopReason 应为字符串: ${promptResult.stopReason}`,
    );
    assert(
      ["end_turn", "max_tokens", "max_turn_requests"].includes(promptResult.stopReason),
      `stopReason 应为有效值: ${promptResult.stopReason}`,
    );

    // 5. 统计收到的 update 类型
    const updateTypes = new Map<string, number>();
    for (const update of ctx.client.updates) {
      const type = update.update.sessionUpdate;
      updateTypes.set(type, (updateTypes.get(type) || 0) + 1);
    }

    console.log("\n📊 收到的 session/update 统计:");
    for (const [type, count] of updateTypes) {
      console.log(`  - ${type}: ${count} 次`);
    }
    console.log(`  总计: ${ctx.client.updates.length} 次`);

    // 6. 验证收到了 agent_message_chunk
    assert(
      (updateTypes.get("agent_message_chunk") || 0) > 0,
      "应至少收到 1 个 agent_message_chunk",
    );

    // 7. 发送第二轮 prompt（验证多轮对话）
    console.log("\n📝 发送第二轮 prompt: '谢谢！再见。'\n");
    console.log("--- Agent 回复 ---");

    const secondResult = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "谢谢！再见。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---\n");
    assert(
      secondResult.stopReason === "end_turn",
      `第二轮 stopReason 应为 end_turn: ${secondResult.stopReason}`,
    );

    console.log("\n✅ ACP Prompt 与流式输出测试通过!");
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
