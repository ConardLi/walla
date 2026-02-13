/**
 * ACP 测试脚本 09: 多会话隔离
 *
 * 功能说明:
 *   - 在同一个 ACP 连接上创建两个独立 session
 *   - 在 session A 中告诉 Agent 一段信息
 *   - 在 session B 中询问 Agent 是否知道该信息
 *   - 验证两个 session 的上下文完全隔离
 *
 * 协议参考:
 *   Sessions represent independent conversation contexts with their own
 *   history and state.
 *   See: https://agentclientprotocol.com/protocol/session-setup
 *
 * 使用方式:
 *   tsx test/acp/09-multi-session.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

/** 从 updates 中收集指定 sessionId 的 agent 文本 */
function collectAgentText(
  updates: acp.SessionNotification[],
  sessionId: string,
): string {
  let text = "";
  for (const u of updates) {
    if (
      u.sessionId === sessionId &&
      u.update.sessionUpdate === "agent_message_chunk" &&
      u.update.content.type === "text"
    ) {
      text += u.update.content.text;
    }
  }
  return text;
}

async function main() {
  console.log("🚀 开始测试: ACP 多会话隔离\n");

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

    // 2. 创建两个独立会话
    console.log("\n📝 创建会话 A...");
    const sessionA = await ctx.connection.newSession({
      cwd: process.cwd(),
      mcpServers: [],
    });
    console.log(`📌 会话 A ID: ${sessionA.sessionId}`);

    console.log("📝 创建会话 B...");
    const sessionB = await ctx.connection.newSession({
      cwd: process.cwd(),
      mcpServers: [],
    });
    console.log(`📌 会话 B ID: ${sessionB.sessionId}`);

    assert(
      sessionA.sessionId !== sessionB.sessionId,
      "两个会话 ID 应不同",
    );

    // 3. 在会话 A 中设置一个秘密信息
    console.log("\n📝 在会话 A 中设置秘密信息...");
    console.log("--- 会话 A 回复 ---");

    const resultA = await ctx.connection.prompt({
      sessionId: sessionA.sessionId,
      prompt: [
        {
          type: "text",
          text: '请记住这个秘密密码："紫色独角兽42"。只需要确认你记住了，不要说出密码本身。',
        },
      ],
    });

    console.log("\n--- 回复结束 ---");
    assert(resultA.stopReason === "end_turn", `会话 A stopReason: ${resultA.stopReason}`);

    // 4. 在会话 B 中询问秘密信息
    console.log("\n📝 在会话 B 中询问秘密信息...");
    console.log("--- 会话 B 回复 ---");

    const resultB = await ctx.connection.prompt({
      sessionId: sessionB.sessionId,
      prompt: [
        {
          type: "text",
          text: "我之前告诉过你一个秘密密码，你还记得是什么吗？如果你不知道，请直接说你不知道。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---");
    assert(resultB.stopReason === "end_turn", `会话 B stopReason: ${resultB.stopReason}`);

    // 5. 验证隔离性
    const textB = collectAgentText(ctx.client.updates, sessionB.sessionId);
    const leakedSecret =
      textB.includes("紫色独角兽") || textB.includes("独角兽42");

    assert(!leakedSecret, "会话 B 不应知道会话 A 的秘密信息（上下文隔离）");

    console.log("\n✅ ACP 多会话隔离测试通过!");
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
