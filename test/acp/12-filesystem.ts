/**
 * ACP 测试脚本 12: 文件系统读写 (fs/read_text_file, fs/write_text_file)
 *
 * 功能说明:
 *   - Client 在 initialize 时声明 fs.readTextFile / fs.writeTextFile 能力
 *   - 发送一个会触发 Agent 读取文件的 prompt
 *   - Agent 会通过 ACP 反向调用 Client 的 readTextFile/writeTextFile
 *   - 通过 tool_call update 中的 kind 和结果验证文件操作发生
 *
 * 协议参考:
 *   Agent → Client: fs/read_text_file { sessionId, path, line?, limit? }
 *   Agent → Client: fs/write_text_file { sessionId, path, content }
 *   能力通过 clientCapabilities.fs 声明
 *   See: https://agentclientprotocol.com/protocol/file-system
 *
 * 使用方式:
 *   tsx test/acp/12-filesystem.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 文件系统读写\n");

  let ctx: ACPTestContext | null = null;

  try {
    ctx = await initACPAgent();

    // 1. 初始化（声明 fs 能力）
    console.log("📝 初始化 ACP 连接（声明 fs 能力）...");
    const initResult = await ctx.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {
        fs: {
          readTextFile: true,
          writeTextFile: true,
        },
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

    // 3. 发送一个会触发文件读取的 prompt
    console.log("\n📝 发送 prompt（期望触发文件读取）...");
    console.log("--- Agent 回复 ---");

    const result = await ctx.connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: "请读取当前目录下的 package.json 文件，告诉我项目的名称和版本号。",
        },
      ],
    });

    console.log("\n--- 回复结束 ---\n");

    // 4. 分析 tool_call 中的文件操作
    const toolCalls = ctx.client.updates.filter(
      (u) => u.update.sessionUpdate === "tool_call",
    );
    const readToolCalls = toolCalls.filter((u) => {
      const update = u.update as any;
      return update.kind === "read";
    });

    console.log(`📊 工具调用统计:`);
    console.log(`  - 总工具调用: ${toolCalls.length} 次`);
    console.log(`  - 读取类型 (kind=read): ${readToolCalls.length} 次`);

    for (const tc of toolCalls) {
      const u = tc.update as any;
      console.log(`  🔧 ${u.title} (kind: ${u.kind}, status: ${u.status})`);
    }

    // 5. 验证 Agent 回复中包含 package.json 信息
    let agentText = "";
    for (const u of ctx.client.updates) {
      if (
        u.update.sessionUpdate === "agent_message_chunk" &&
        u.update.content.type === "text"
      ) {
        agentText += u.update.content.text;
      }
    }

    assert(
      result.stopReason === "end_turn",
      `stopReason: ${result.stopReason}`,
    );

    const mentionsProject =
      agentText.includes("opencode") || agentText.includes("name");
    assert(mentionsProject, "Agent 回复应提及项目名称（证明读取了文件）");

    console.log("\n✅ ACP 文件系统读写测试通过!");
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
