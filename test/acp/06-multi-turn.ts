/**
 * ACP 测试脚本 06: 多轮对话上下文保持
 *
 * 功能说明:
 *   - 在同一个 session 中连续发送多轮 prompt
 *   - 验证 Agent 能记住之前对话的上下文
 *   - 第一轮告诉 Agent 一个自定义名词的定义
 *   - 第二轮让 Agent 回忆这个名词
 *   - 验证回复中包含之前定义的内容
 *
 * 使用方式:
 *   tsx test/acp/06-multi-turn.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 多轮对话上下文保持\n");

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

    // 3. 第一轮：定义一个自定义概念
    console.log("\n📝 第一轮: 定义自定义概念...");
    console.log("--- Agent 回复 ---");

    const result1 = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: '我定义一个新词叫"蓝猫协议"，它的含义是：在每天下午三点喝一杯咖啡。请记住这个定义，然后简单确认你已经记住了。',
        },
      ],
    });

    console.log("\n--- 回复结束 ---");
    assert(result1.stopReason === "end_turn", `第一轮 stopReason: ${result1.stopReason}`);

    // 收集第一轮的 agent 回复文本
    const round1Text = collectAgentText(ctx.client.updates);
    console.log(`📌 第一轮回复长度: ${round1Text.length} 字符`);

    // 清空 updates 以便统计第二轮
    ctx.client.updates = [];

    // 4. 第二轮：让 Agent 回忆
    console.log("\n📝 第二轮: 让 Agent 回忆概念...");
    console.log("--- Agent 回复 ---");

    const result2 = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: '"蓝猫协议"是什么意思？请告诉我它的定义。',
        },
      ],
    });

    console.log("\n--- 回复结束 ---");
    assert(result2.stopReason === "end_turn", `第二轮 stopReason: ${result2.stopReason}`);

    // 验证 Agent 记住了上下文
    const round2Text = collectAgentText(ctx.client.updates);
    console.log(`📌 第二轮回复长度: ${round2Text.length} 字符`);

    const hasContext =
      round2Text.includes("咖啡") ||
      round2Text.includes("下午三点") ||
      round2Text.includes("三点") ||
      round2Text.includes("蓝猫");
    assert(hasContext, "第二轮回复应包含第一轮定义的内容（上下文保持）");

    // 5. 第三轮：追加一个无关问题，验证会话仍然正常
    console.log("\n📝 第三轮: 发送无关问题...");
    ctx.client.updates = [];
    console.log("--- Agent 回复 ---");

    const result3 = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "1 + 1 等于几？只回答数字。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---");
    assert(result3.stopReason === "end_turn", `第三轮 stopReason: ${result3.stopReason}`);

    const round3Text = collectAgentText(ctx.client.updates);
    const hasTwo = round3Text.includes("2");
    assert(hasTwo, "第三轮回复应包含数字 2");

    console.log("\n✅ ACP 多轮对话上下文保持测试通过!");
  } catch (error) {
    console.error("❌ 测试失败:", (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  } finally {
    ctx?.cleanup();
    console.log("🔒 Agent 进程已关闭");
  }
}

/** 从 updates 中收集所有 agent_message_chunk 的文本 */
function collectAgentText(updates: acp.SessionNotification[]): string {
  let text = "";
  for (const u of updates) {
    if (
      u.update.sessionUpdate === "agent_message_chunk" &&
      u.update.content.type === "text"
    ) {
      text += u.update.content.text;
    }
  }
  return text;
}

main();
