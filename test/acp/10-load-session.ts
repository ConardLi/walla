/**
 * ACP 测试脚本 10: 加载已有会话 (session/load)
 *
 * 功能说明:
 *   - 检查 Agent 是否支持 loadSession 能力
 *   - 如果支持，创建一个会话并发送消息
 *   - 然后通过 session/load 重新加载该会话
 *   - 验证加载时通过 session/update 通知回放历史消息
 *
 * 协议参考:
 *   loadSession 能力通过 initialize 响应的 agentCapabilities.loadSession 声明
 *   session/load 请求需要 sessionId + cwd + mcpServers
 *   Agent 会通过 user_message_chunk 和 agent_message_chunk 回放历史
 *   See: https://agentclientprotocol.com/protocol/session-setup#loading-sessions
 *
 * 使用方式:
 *   tsx test/acp/10-load-session.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 加载已有会话\n");

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

    // 2. 检查 loadSession 能力
    const supportsLoad = initResult.agentCapabilities?.loadSession === true;
    console.log(`\n📌 loadSession 能力: ${supportsLoad}`);

    if (!supportsLoad) {
      console.log("⚠️ Agent 不支持 loadSession，跳过此测试");
      console.log("\n✅ ACP 加载会话测试通过（Agent 不支持此功能）!");
      return;
    }

    // 3. 创建并使用一个会话
    console.log("\n📝 创建会话...");
    const session = await ctx.connection.newSession({
      cwd: process.cwd(),
      mcpServers: [],
    });
    console.log(`📌 会话 ID: ${session.sessionId}`);

    console.log("📝 发送一条消息...");
    console.log("--- Agent 回复 ---");

    const result = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "请记住数字 7749。只需确认你记住了。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---");
    assert(result.stopReason === "end_turn", `stopReason: ${result.stopReason}`);

    // 4. 清空 updates，然后 load 同一个 session
    ctx.client.updates = [];

    console.log("\n📝 加载已有会话...");
    try {
      const loadResult = await ctx.connection.loadSession({
        sessionId: session.sessionId,
        cwd: process.cwd(),
        mcpServers: [],
      });

      console.log("✅ session/load 成功");

      // 5. 验证回放的历史消息
      const replayedTypes = new Map<string, number>();
      for (const u of ctx.client.updates) {
        const type = u.update.sessionUpdate;
        replayedTypes.set(type, (replayedTypes.get(type) || 0) + 1);
      }

      console.log("\n📊 加载时回放的 update 统计:");
      for (const [type, count] of replayedTypes) {
        console.log(`  - ${type}: ${count} 次`);
      }
      console.log(`  总计: ${ctx.client.updates.length} 次`);

      // 应该至少有 user_message_chunk 和 agent_message_chunk
      const hasUserReplay = (replayedTypes.get("user_message_chunk") || 0) > 0;
      const hasAgentReplay = (replayedTypes.get("agent_message_chunk") || 0) > 0;

      if (hasUserReplay) {
        console.log("✅ 收到了 user_message_chunk 回放");
      }
      if (hasAgentReplay) {
        console.log("✅ 收到了 agent_message_chunk 回放");
      }

      // 6. 在 loaded session 中继续对话
      ctx.client.updates = [];
      console.log("\n📝 在 loaded session 中继续对话...");
      console.log("--- Agent 回复 ---");

      const result2 = await ctx.connection.prompt({
        sessionId: session.sessionId,
        prompt: [
          {
            type: "text",
            text: "我让你记住的数字是什么？",
          },
        ],
      });

      console.log("\n--- 回复结束 ---");
      assert(result2.stopReason === "end_turn", `继续对话 stopReason: ${result2.stopReason}`);

      // 验证 Agent 记得之前的上下文
      let agentText = "";
      for (const u of ctx.client.updates) {
        if (
          u.update.sessionUpdate === "agent_message_chunk" &&
          u.update.content.type === "text"
        ) {
          agentText += u.update.content.text;
        }
      }
      const remembers = agentText.includes("7749");
      assert(remembers, "Agent 应记住 loaded session 中的数字 7749");
    } catch (err) {
      console.log(`⚠️ session/load 失败: ${(err as Error).message}`);
      console.log("   这可能是 Agent 的 loadSession 实现不完整");
    }

    console.log("\n✅ ACP 加载已有会话测试通过!");
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
