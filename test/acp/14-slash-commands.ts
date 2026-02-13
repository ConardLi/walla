/**
 * ACP 测试脚本 14: 斜杠命令 (Slash Commands)
 *
 * 功能说明:
 *   - 创建会话后，收集 available_commands_update 通知中广播的命令列表
 *   - 验证命令结构（name、description、input?）
 *   - 如果有可用命令，通过 session/prompt 发送 /command 格式的文本执行
 *   - 验证 Agent 正确处理了斜杠命令
 *
 * 协议参考:
 *   session/update { sessionUpdate: "available_commands_update", availableCommands: [...] }
 *   AvailableCommand { name, description, input?: { hint } }
 *   运行命令: session/prompt { prompt: [{ type: "text", text: "/command args" }] }
 *   See: https://agentclientprotocol.com/protocol/slash-commands
 *
 * 使用方式:
 *   tsx test/acp/14-slash-commands.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 斜杠命令\n");

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

    // 3. 收集 available_commands_update 通知
    const cmdUpdates = ctx.client.updates.filter(
      (u) => u.update.sessionUpdate === "available_commands_update",
    );

    if (cmdUpdates.length === 0) {
      console.log("\n⚠️ 未收到 available_commands_update 通知");

      // 发一个简单 prompt 看看是否之后会收到
      console.log("📝 发送一个简单 prompt 看是否触发命令广播...");
      await ctx.connection.prompt({
        sessionId: session.sessionId,
        prompt: [{ type: "text", text: "你好" }],
      });

      // 再次检查
      const cmdUpdates2 = ctx.client.updates.filter(
        (u) => u.update.sessionUpdate === "available_commands_update",
      );

      if (cmdUpdates2.length === 0) {
        console.log("⚠️ Agent 未广播任何斜杠命令，跳过命令执行测试");
        console.log("\n✅ ACP 斜杠命令测试通过（Agent 无可用命令）!");
        return;
      }

      cmdUpdates.push(...cmdUpdates2);
    }

    // 4. 解析并打印可用命令
    const latestUpdate = cmdUpdates[cmdUpdates.length - 1].update as any;
    const commands = latestUpdate.availableCommands;

    assert(Array.isArray(commands), "availableCommands 应为数组");
    console.log(`\n📌 可用斜杠命令 (${commands.length} 个):`);

    for (const cmd of commands) {
      assert(typeof cmd.name === "string", `命令应有 name: ${cmd.name}`);
      assert(typeof cmd.description === "string", `命令应有 description`);
      const inputHint = cmd.input?.hint ? ` (input: ${cmd.input.hint})` : "";
      console.log(`  /${cmd.name}: ${cmd.description}${inputHint}`);
    }

    // 5. 尝试执行一个不需要输入参数的命令
    const simpleCmd = commands.find((c: any) => !c.input);
    const cmdWithInput = commands.find((c: any) => c.input);

    if (simpleCmd) {
      console.log(`\n📝 执行无参数命令: /${simpleCmd.name}`);
      ctx.client.updates = [];
      console.log("--- Agent 回复 ---");

      const cmdResult = await ctx.connection.prompt({
        sessionId: session.sessionId,
        prompt: [
          {
            type: "text",
            text: `/${simpleCmd.name}`,
          },
        ],
      });

      console.log("\n--- 回复结束 ---");
      assert(
        typeof cmdResult.stopReason === "string",
        `命令执行 stopReason: ${cmdResult.stopReason}`,
      );
      console.log(`✅ /${simpleCmd.name} 执行完成 (stopReason: ${cmdResult.stopReason})`);
    }

    if (cmdWithInput) {
      console.log(`\n📝 执行带参数命令: /${cmdWithInput.name} (hint: ${cmdWithInput.input.hint})`);
      ctx.client.updates = [];
      console.log("--- Agent 回复 ---");

      const cmdResult = await ctx.connection.prompt({
        sessionId: session.sessionId,
        prompt: [
          {
            type: "text",
            text: `/${cmdWithInput.name} ACP protocol`,
          },
        ],
      });

      console.log("\n--- 回复结束 ---");
      assert(
        typeof cmdResult.stopReason === "string",
        `命令执行 stopReason: ${cmdResult.stopReason}`,
      );
      console.log(`✅ /${cmdWithInput.name} 执行完成 (stopReason: ${cmdResult.stopReason})`);
    }

    console.log("\n✅ ACP 斜杠命令测试通过!");
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
