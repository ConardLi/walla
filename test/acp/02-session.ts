/**
 * ACP 测试脚本 02: 会话创建与配置
 *
 * 功能说明:
 *   - 初始化 ACP 连接后，调用 newSession 创建新会话
 *   - 验证返回的 sessionId
 *   - 检查 modes（SessionModeState）：availableModes + currentModeId
 *   - 检查 configOptions（SessionConfigOption[]）
 *   - 如果 Agent 支持多模式，测试 setSessionMode
 *
 * 类型参考（@agentclientprotocol/sdk v0.14）:
 *   NewSessionResponse {
 *     sessionId: SessionId;
 *     modes?: SessionModeState;       // { availableModes, currentModeId }
 *     configOptions?: SessionConfigOption[];
 *     models?: SessionModelState;     // experimental
 *   }
 *
 * 使用方式:
 *   tsx test/acp/02-session.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import {
  initACPAgent,
  assert,
  printResult,
  type ACPTestContext,
} from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 会话创建与配置\n");

  let ctx: ACPTestContext | null = null;

  try {
    ctx = await initACPAgent();

    // 1. 初始化连接
    console.log("📝 初始化 ACP 连接...");
    const initResult = await ctx.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true },
        terminal: true,
      },
    });
    console.log(
      `✅ 已连接 Agent: ${initResult.agentInfo?.name} v${initResult.agentInfo?.version}`,
    );

    // 2. 创建新会话
    console.log("\n📝 创建新会话...");
    const sessionResult = await ctx.connection.newSession({
      cwd: process.cwd(),
      mcpServers: [],
    });

    printResult("NewSession 响应", sessionResult);

    // 3. 验证 sessionId
    assert(
      typeof sessionResult.sessionId === "string" &&
        sessionResult.sessionId.length > 0,
      `会话 ID 应为非空字符串: ${sessionResult.sessionId}`,
    );
    console.log(`📌 会话 ID: ${sessionResult.sessionId}`);

    // 4. 检查 modes（嵌套在 SessionModeState 中）
    const modes = sessionResult.modes;
    if (modes && modes.availableModes && modes.availableModes.length > 0) {
      console.log("\n📌 可用模式:");
      for (const mode of modes.availableModes) {
        const marker = mode.id === modes.currentModeId ? " (当前)" : "";
        console.log(`  - ${mode.id}: ${mode.name}${marker}`);
        if (mode.description) {
          console.log(`    ${mode.description}`);
        }
      }

      // 5. 测试切换模式（如果有多个模式）
      if (modes.availableModes.length > 1) {
        const otherMode = modes.availableModes.find(
          (m) => m.id !== modes.currentModeId,
        );
        if (otherMode) {
          console.log(`\n📝 切换模式到: ${otherMode.id}...`);
          try {
            await ctx.connection.setSessionMode({
              sessionId: sessionResult.sessionId,
              modeId: otherMode.id,
            });
            console.log(`✅ 模式已切换到: ${otherMode.id}`);
          } catch (err) {
            console.log(`⚠️ 切换模式失败: ${(err as Error).message}`);
          }
        }
      }
    } else {
      console.log("\n📌 Agent 未提供可用模式");
    }

    // 6. 检查 configOptions
    const configOptions = sessionResult.configOptions;
    if (configOptions && configOptions.length > 0) {
      console.log("\n📌 会话配置选项:");
      for (const opt of configOptions) {
        const category = opt.category ?? "other";
        console.log(
          `  - [${category}] ${opt.name} (id: ${opt.id}, type: ${opt.type})`,
        );
        if (opt.description) {
          console.log(`    描述: ${opt.description}`);
        }
        // SessionConfigOption 的 type 目前只有 "select"
        if (opt.type === "select") {
          console.log(`    当前值: ${opt.currentValue}`);
        }
      }
    } else {
      console.log("\n📌 Agent 未提供配置选项");
    }

    // 7. 检查 models（experimental）
    const models = sessionResult.models;
    if (models) {
      console.log("\n📌 模型状态 (experimental):");
      printResult("models", models);
    }

    console.log("\n✅ ACP 会话创建与配置测试通过!");
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
