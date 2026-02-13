/**
 * ACP 测试脚本 11: 全面验证 session/update 通知类型
 *
 * 功能说明:
 *   - 发送一个需要 Agent 使用工具的 prompt（如读取文件、执行命令）
 *   - 收集并分类所有 session/update 通知
 *   - 验证各种 update 类型的数据结构是否符合协议规范
 *   - 特别关注: tool_call、tool_call_update 的 content（diff/terminal/content）
 *
 * 协议参考:
 *   SessionUpdate.sessionUpdate 可选值:
 *     user_message_chunk, agent_message_chunk, agent_thought_chunk,
 *     tool_call, tool_call_update, plan,
 *     available_commands_update, current_mode_update, config_option_update
 *   See: https://agentclientprotocol.com/protocol/prompt-turn
 *        https://agentclientprotocol.com/protocol/tool-calls
 *
 * 使用方式:
 *   tsx test/acp/11-update-types.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP session/update 通知类型全面验证\n");

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

    // 3. 发送一个会触发工具调用的 prompt
    console.log("\n📝 发送 prompt（预期触发工具调用）...");
    console.log("--- Agent 回复 ---");

    const result = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "请帮我查看当前目录下有哪些文件，并读取 package.json 的内容，告诉我项目名称。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---\n");

    // 4. 分类统计所有 update
    const updatesByType = new Map<string, acp.SessionNotification[]>();
    for (const u of ctx.client.updates) {
      const type = u.update.sessionUpdate;
      if (!updatesByType.has(type)) {
        updatesByType.set(type, []);
      }
      updatesByType.get(type)!.push(u);
    }

    console.log("📊 收到的 session/update 类型分析:");
    console.log(`   总计: ${ctx.client.updates.length} 个 update\n`);

    // 5. 验证各类型结构

    // --- agent_message_chunk ---
    const msgChunks = updatesByType.get("agent_message_chunk") || [];
    console.log(`📨 agent_message_chunk: ${msgChunks.length} 个`);
    if (msgChunks.length > 0) {
      const first = msgChunks[0].update as any;
      assert("content" in first, "agent_message_chunk 应有 content 字段");
      assert(
        typeof first.content.type === "string",
        `content.type 应为字符串: ${first.content.type}`,
      );
    }

    // --- agent_thought_chunk ---
    const thoughtChunks = updatesByType.get("agent_thought_chunk") || [];
    console.log(`💭 agent_thought_chunk: ${thoughtChunks.length} 个`);
    if (thoughtChunks.length > 0) {
      const first = thoughtChunks[0].update as any;
      assert("content" in first, "agent_thought_chunk 应有 content 字段");
    }

    // --- tool_call ---
    const toolCalls = updatesByType.get("tool_call") || [];
    console.log(`🔧 tool_call: ${toolCalls.length} 个`);
    for (const tc of toolCalls) {
      const u = tc.update as any;
      assert(typeof u.toolCallId === "string", `tool_call 应有 toolCallId: ${u.toolCallId}`);
      assert(typeof u.title === "string", `tool_call 应有 title: ${u.title}`);
      console.log(`   - ${u.toolCallId}: "${u.title}" (kind: ${u.kind}, status: ${u.status})`);
      if (u.kind) {
        const validKinds = ["read", "edit", "delete", "move", "search", "execute", "think", "fetch", "switch_mode", "other"];
        assert(
          validKinds.includes(u.kind),
          `tool_call.kind 应为有效值: ${u.kind}`,
        );
      }
    }

    // --- tool_call_update ---
    const toolUpdates = updatesByType.get("tool_call_update") || [];
    console.log(`🔧 tool_call_update: ${toolUpdates.length} 个`);
    for (const tu of toolUpdates) {
      const u = tu.update as any;
      assert(typeof u.toolCallId === "string", `tool_call_update 应有 toolCallId`);
      if (u.status) {
        const validStatuses = ["pending", "in_progress", "completed", "error"];
        console.log(`   - ${u.toolCallId}: status=${u.status}`);
      }
      // 检查 content 类型（diff / content / terminal）
      if (u.content && Array.isArray(u.content)) {
        for (const c of u.content) {
          console.log(`     content type: ${c.type}`);
          if (c.type === "diff") {
            assert(typeof c.path === "string", "diff 应有 path");
            assert(typeof c.newText === "string", "diff 应有 newText");
          } else if (c.type === "content") {
            assert(c.content && typeof c.content.type === "string", "content 应有 content.type");
          } else if (c.type === "terminal") {
            assert(typeof c.terminalId === "string", "terminal 应有 terminalId");
          }
        }
      }
    }

    // --- plan ---
    const plans = updatesByType.get("plan") || [];
    console.log(`📋 plan: ${plans.length} 个`);
    if (plans.length > 0) {
      const u = plans[0].update as any;
      assert(Array.isArray(u.entries), "plan 应有 entries 数组");
      for (const entry of u.entries) {
        console.log(`   - [${entry.status}] ${entry.content} (priority: ${entry.priority})`);
      }
    }

    // --- available_commands_update ---
    const cmdUpdates = updatesByType.get("available_commands_update") || [];
    console.log(`📜 available_commands_update: ${cmdUpdates.length} 个`);
    if (cmdUpdates.length > 0) {
      const u = cmdUpdates[0].update as any;
      assert(Array.isArray(u.availableCommands), "应有 availableCommands 数组");
      for (const cmd of u.availableCommands) {
        console.log(`   - /${cmd.name}: ${cmd.description}`);
      }
    }

    // --- current_mode_update ---
    const modeUpdates = updatesByType.get("current_mode_update") || [];
    console.log(`🔄 current_mode_update: ${modeUpdates.length} 个`);

    // --- config_option_update ---
    const configUpdates = updatesByType.get("config_option_update") || [];
    console.log(`⚙️ config_option_update: ${configUpdates.length} 个`);

    // 6. 基础断言
    assert(result.stopReason === "end_turn", `stopReason: ${result.stopReason}`);
    assert(msgChunks.length > 0, "应至少收到 1 个 agent_message_chunk");

    console.log("\n✅ ACP session/update 通知类型全面验证测试通过!");
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
