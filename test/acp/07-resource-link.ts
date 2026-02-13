/**
 * ACP 测试脚本 07: 资源链接 (Resource Link) 上下文
 *
 * 功能说明:
 *   - 在 prompt 中附带 resource_link 类型的 ContentBlock
 *   - 让 Agent 根据指定的文件路径进行分析
 *   - 验证 Agent 能正确处理 resource_link 引用
 *   - 所有 Agent 必须支持 text 和 resource_link 两种内容类型
 *
 * 协议参考:
 *   ContentBlock { type: "resource_link", uri: string, name?: string, mimeType?: string }
 *   See: https://agentclientprotocol.com/protocol/content
 *
 * 使用方式:
 *   tsx test/acp/07-resource-link.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import * as path from "node:path";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 资源链接上下文\n");

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

    // 3. 发送包含 resource_link 的 prompt
    const filePath = path.resolve(process.cwd(), "package.json");
    const fileUri = `file://${filePath}`;

    console.log(`\n📝 发送 prompt，附带 resource_link: ${fileUri}`);
    console.log("--- Agent 回复 ---");

    const result = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "请查看下面引用的文件，告诉我这个项目的名称和版本号。",
        },
        {
          type: "resource_link",
          uri: fileUri,
          name: "package.json",
          mimeType: "application/json",
        } as any,
      ],
    });

    console.log("\n--- 回复结束 ---");

    assert(
      result.stopReason === "end_turn",
      `stopReason 应为 end_turn: ${result.stopReason}`,
    );

    // 4. 统计 update 类型
    const updateTypes = new Map<string, number>();
    for (const u of ctx.client.updates) {
      const type = u.update.sessionUpdate;
      updateTypes.set(type, (updateTypes.get(type) || 0) + 1);
    }

    console.log("\n📊 收到的 session/update 统计:");
    for (const [type, count] of updateTypes) {
      console.log(`  - ${type}: ${count} 次`);
    }

    assert(
      (updateTypes.get("agent_message_chunk") || 0) > 0,
      "应至少收到 1 个 agent_message_chunk",
    );

    console.log("\n✅ ACP 资源链接上下文测试通过!");
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
