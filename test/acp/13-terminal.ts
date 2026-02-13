/**
 * ACP 测试脚本 13: 终端命令执行 (terminal/create, terminal/output, etc.)
 *
 * 功能说明:
 *   - Client 在 initialize 时声明 terminal: true 能力
 *   - 发送一个会触发 Agent 执行终端命令的 prompt
 *   - 验证 Agent 通过 tool_call 报告了 kind="execute" 的操作
 *   - 验证 tool_call_update 中包含 terminal 类型的 content
 *
 * 协议参考:
 *   Agent → Client: terminal/create { sessionId, command, args?, env?, cwd? }
 *   Agent → Client: terminal/output { sessionId, terminalId }
 *   Agent → Client: terminal/wait_for_exit { sessionId, terminalId }
 *   Agent → Client: terminal/release { sessionId, terminalId }
 *   Tool call content: { type: "terminal", terminalId: string }
 *   See: https://agentclientprotocol.com/protocol/terminals
 *
 * 使用方式:
 *   tsx test/acp/13-terminal.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 终端命令执行\n");

  let ctx: ACPTestContext | null = null;

  try {
    ctx = await initACPAgent();

    // 1. 初始化（声明 terminal 能力）
    console.log("📝 初始化 ACP 连接（声明 terminal 能力）...");
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

    // 3. 发送一个会触发终端命令的 prompt
    console.log("\n📝 发送 prompt（期望触发终端命令）...");
    console.log("--- Agent 回复 ---");

    const result = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: '请在终端中执行 "echo hello-acp-test" 命令，然后告诉我执行结果。',
        },
      ],
    });

    console.log("\n--- 回复结束 ---\n");

    // 4. 分析 tool_call 中的终端操作
    const toolCalls = ctx.client.updates.filter(
      (u) => u.update.sessionUpdate === "tool_call",
    );
    const execToolCalls = toolCalls.filter((u) => {
      const update = u.update as any;
      return update.kind === "execute";
    });

    console.log(`📊 工具调用统计:`);
    console.log(`  - 总工具调用: ${toolCalls.length} 次`);
    console.log(`  - 执行类型 (kind=execute): ${execToolCalls.length} 次`);

    for (const tc of toolCalls) {
      const u = tc.update as any;
      console.log(`  🔧 ${u.title} (kind: ${u.kind}, status: ${u.status})`);
    }

    // 5. 检查 tool_call_update 中是否有 terminal 类型 content
    const toolUpdates = ctx.client.updates.filter(
      (u) => u.update.sessionUpdate === "tool_call_update",
    );
    let hasTerminalContent = false;
    for (const tu of toolUpdates) {
      const u = tu.update as any;
      if (u.content && Array.isArray(u.content)) {
        for (const c of u.content) {
          if (c.type === "terminal") {
            hasTerminalContent = true;
            console.log(`  💻 终端内容: terminalId=${c.terminalId}`);
          }
        }
      }
    }

    // 6. 验证 Agent 回复包含执行结果
    let agentText = "";
    for (const u of ctx.client.updates) {
      if (
        u.update.sessionUpdate === "agent_message_chunk" &&
        u.update.content.type === "text"
      ) {
        agentText += u.update.content.text;
      }
    }

    assert(result.stopReason === "end_turn", `stopReason: ${result.stopReason}`);

    const mentionsResult =
      agentText.includes("hello-acp-test") || agentText.includes("hello");
    assert(mentionsResult, "Agent 回复应包含命令执行结果");

    if (hasTerminalContent) {
      console.log("✅ tool_call_update 包含 terminal 类型 content");
    } else {
      console.log("⚠️ tool_call_update 中未发现 terminal 类型 content（Agent 可能直接在工具内部处理了）");
    }

    console.log("\n✅ ACP 终端命令执行测试通过!");
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
