/**
 * ACP 测试脚本 01: 初始化握手
 *
 * 功能说明:
 *   - 通过 stdio 传输启动 OpenCode Agent 子进程
 *   - 发送 initialize 请求，进行能力协商
 *   - 验证 Agent 返回的 protocolVersion、agentCapabilities、authMethods 等
 *   - 打印 Agent 支持的能力信息
 *
 * 使用方式:
 *   tsx test/acp/01-initialize.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import { initACPAgent, assert, printResult, type ACPTestContext } from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 初始化握手\n");

  let ctx: ACPTestContext | null = null;

  try {
    ctx = await initACPAgent();

    // 1. 发送 initialize 请求
    console.log("📝 发送 initialize 请求...");
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

    printResult("Initialize 响应", initResult);

    // 2. 验证协议版本
    assert(
      typeof initResult.protocolVersion === "number",
      `协议版本应为数字: ${initResult.protocolVersion}`,
    );

    // 3. 验证 Agent 信息
    assert(
      initResult.agentInfo !== undefined && initResult.agentInfo !== null,
      "应返回 agentInfo",
    );
    if (initResult.agentInfo) {
      console.log(`📌 Agent: ${initResult.agentInfo.name} v${initResult.agentInfo.version}`);
      if (initResult.agentInfo.title) {
        console.log(`📌 Title: ${initResult.agentInfo.title}`);
      }
    }

    // 4. 验证 Agent 能力
    const caps = initResult.agentCapabilities;
    console.log("\n📌 Agent 能力:");
    if (caps) {
      console.log(`  - loadSession: ${caps.loadSession ?? false}`);
      console.log(`  - promptCapabilities: ${JSON.stringify(caps.promptCapabilities)}`);
      console.log(`  - mcpCapabilities: ${JSON.stringify(caps.mcpCapabilities)}`);
      console.log(`  - sessionCapabilities: ${JSON.stringify(caps.sessionCapabilities)}`);
    }

    // 5. 检查认证方法
    if (initResult.authMethods && initResult.authMethods.length > 0) {
      console.log("\n📌 可用认证方法:");
      for (const method of initResult.authMethods) {
        console.log(`  - ${method.id}: ${method.name}`);
      }
    } else {
      console.log("\n📌 无需认证");
    }

    console.log("\n✅ ACP 初始化握手测试通过!");
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
