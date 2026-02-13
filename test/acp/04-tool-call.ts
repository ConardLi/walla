/**
 * ACP 测试脚本 04: 工具调用与权限请求
 *
 * 功能说明:
 *   - 初始化 ACP 连接并创建会话
 *   - 发送一个会触发工具调用的 prompt（例如让 Agent 读取文件或执行命令）
 *   - 通过 TestClient 的回调接收 tool_call / tool_call_update 通知
 *   - 通过 TestClient.requestPermission 处理权限请求（自动批准）
 *   - 验证工具调用的完整生命周期
 *
 * 注意:
 *   此脚本会实际调用 AI 模型并可能执行工具。
 *   TestClient 默认自动批准所有权限请求。
 *
 * 使用方式:
 *   tsx test/acp/04-tool-call.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, printResult, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 工具调用与权限请求\n");

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

    // 3. 发送会触发工具调用的 prompt
    console.log("\n📝 发送 prompt: '请读取当前目录下的 package.json 文件，告诉我项目名称和版本号。'\n");
    console.log("--- Agent 回复 ---");

    const promptResult = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "请读取当前目录下的 package.json 文件，告诉我项目名称和版本号。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---\n");

    printResult("Prompt 响应", promptResult);

    // 4. 统计 update 类型
    const updateTypes = new Map<string, number>();
    for (const update of ctx.client.updates) {
      const type = update.update.sessionUpdate;
      updateTypes.set(type, (updateTypes.get(type) || 0) + 1);
    }

    console.log("\n📊 收到的 session/update 统计:");
    for (const [type, count] of updateTypes) {
      console.log(`  - ${type}: ${count} 次`);
    }

    // 5. 检查是否有工具调用
    const toolCallCount = (updateTypes.get("tool_call") || 0);
    const toolUpdateCount = (updateTypes.get("tool_call_update") || 0);
    console.log(`\n📌 工具调用: ${toolCallCount} 次发起, ${toolUpdateCount} 次更新`);

    if (toolCallCount > 0) {
      console.log("✅ Agent 成功发起了工具调用");

      // 打印工具调用详情
      const toolCalls = ctx.client.updates.filter(
        (u) => u.update.sessionUpdate === "tool_call",
      );
      for (const tc of toolCalls) {
        const update = tc.update as any;
        console.log(`  🔧 ${update.title} (kind: ${update.kind}, status: ${update.status})`);
      }

      // 打印工具调用结果
      const toolUpdates = ctx.client.updates.filter(
        (u) => u.update.sessionUpdate === "tool_call_update",
      );
      for (const tu of toolUpdates) {
        const update = tu.update as any;
        console.log(`  📋 ${update.toolCallId} → ${update.status}`);
        if (update.content && update.content.length > 0) {
          for (const c of update.content) {
            if (c.type === "diff") {
              console.log(`    📝 Diff: ${c.path}`);
            } else if (c.type === "content" && c.content?.type === "text") {
              const preview = c.content.text.slice(0, 100);
              console.log(`    📄 Text: ${preview}${c.content.text.length > 100 ? "..." : ""}`);
            } else if (c.type === "terminal") {
              console.log(`    💻 Terminal: ${c.terminalId}`);
            }
          }
        }
      }
    } else {
      console.log("⚠️ Agent 未发起工具调用（可能直接从上下文回答了）");
    }

    // 6. 检查权限请求
    console.log(`\n📌 权限请求: ${ctx.client.permissionRequests.length} 次`);
    for (const pr of ctx.client.permissionRequests) {
      console.log(`  🔐 ${pr.toolCall.title}`);
      console.log(`     选项: ${pr.options.map((o) => `${o.name}(${o.kind})`).join(", ")}`);
    }

    assert(
      promptResult.stopReason === "end_turn",
      `stopReason 应为 end_turn: ${promptResult.stopReason}`,
    );

    console.log("\n✅ ACP 工具调用与权限请求测试通过!");
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
