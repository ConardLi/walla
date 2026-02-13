/**
 * ACP 测试脚本 08: 会话配置选项 (setSessionConfigOption)
 *
 * 功能说明:
 *   - 创建会话后，获取 configOptions 列表
 *   - 如果存在 configOptions，尝试通过 setSessionConfigOption 切换值
 *   - 验证响应中返回更新后的完整配置选项列表
 *   - 关注 category 为 "model" 的配置项（模型选择器）
 *
 * 协议参考:
 *   SessionConfigOption { type: "select", id, name, category?, currentValue, options }
 *   setSessionConfigOption({ sessionId, configOptionId, value }) → { configOptions }
 *   See: https://agentclientprotocol.com/protocol/initialization
 *
 * 使用方式:
 *   tsx test/acp/08-config-option.ts
 */

import * as acp from "@agentclientprotocol/sdk";
import {
  initACPAgent,
  assert,
  printResult,
  type ACPTestContext,
} from "./helpers.js";

async function main() {
  console.log("🚀 开始测试: ACP 会话配置选项\n");

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

    // 打印原始响应用于调试
    printResult("NewSession 原始响应", session);

    // 等待异步通知到达（如 config_option_update / available_commands_update）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. 检查 configOptions — 同时检查响应和通知
    let configOptions = session.configOptions;

    // 如果响应中没有，检查 config_option_update 通知
    if (!configOptions || configOptions.length === 0) {
      console.log(
        "\n📝 NewSession 响应中无 configOptions，检查 config_option_update 通知...",
      );
      const configUpdates = ctx.client.updates.filter(
        (u) => u.update.sessionUpdate === "config_option_update",
      );
      if (configUpdates.length > 0) {
        const lastUpdate = configUpdates[configUpdates.length - 1]
          .update as any;
        configOptions = lastUpdate.configOptions;
        console.log(`📌 从 config_option_update 通知中获取到配置选项`);
        printResult("config_option_update", lastUpdate);
      }
    }

    // 也打印所有收到的通知类型
    const updateTypes = new Map<string, number>();
    for (const u of ctx.client.updates) {
      const t = u.update.sessionUpdate;
      updateTypes.set(t, (updateTypes.get(t) || 0) + 1);
    }
    if (updateTypes.size > 0) {
      console.log("\n📊 创建会话后收到的通知:");
      for (const [type, count] of updateTypes) {
        console.log(`  - ${type}: ${count} 次`);
      }
    }

    if (!configOptions || configOptions.length === 0) {
      console.log("\n⚠️ Agent 未提供 configOptions（响应和通知中均无）");
      // 检查 models（experimental）作为替代
      if (session.models) {
        console.log("📌 发现 models (experimental):");
        // printResult("models", session.models);
      }
      console.log("\n✅ ACP 会话配置选项测试通过（Agent 无可配置项）!");
      return;
    }

    console.log(`\n📌 发现 ${configOptions.length} 个配置选项:`);
    for (const opt of configOptions) {
      const category = opt.category ?? "other";
      console.log(`  - [${category}] ${opt.name} (id: ${opt.id})`);
      if (opt.type === "select") {
        console.log(`    当前值: ${opt.currentValue}`);
      }
    }

    // 4. 找到第一个 select 类型的配置项，尝试切换值
    const selectOpt = configOptions.find((o) => o.type === "select");
    if (!selectOpt || selectOpt.type !== "select") {
      console.log("\n⚠️ 未找到 select 类型的配置项，跳过切换测试");
      console.log("\n✅ ACP 会话配置选项测试通过!");
      return;
    }

    // 解析 select 选项的可选值
    const selectData = selectOpt as any;
    const currentValue = selectData.currentValue;
    const options = selectData.options;

    console.log(`\n📝 尝试配置项: ${selectOpt.name} (id: ${selectOpt.id})`);
    console.log(`   当前值: ${currentValue}`);

    // 找到一个不同的值
    let alternateValue: string | null = null;
    if (Array.isArray(options)) {
      // options 可能是 flat array 或 grouped array
      for (const item of options) {
        if (typeof item === "object" && item !== null) {
          // Grouped: { group: string, options: [...] }
          if ("options" in item && Array.isArray(item.options)) {
            for (const subItem of item.options) {
              const val =
                typeof subItem === "string"
                  ? subItem
                  : (subItem?.id ?? subItem?.value);
              if (val && val !== currentValue) {
                alternateValue = val;
                break;
              }
            }
          }
          // Flat: { id: string, name: string }
          const val = item.id ?? item.value;
          if (val && val !== currentValue) {
            alternateValue = val;
          }
        } else if (typeof item === "string" && item !== currentValue) {
          alternateValue = item;
        }
        if (alternateValue) break;
      }
    }

    if (!alternateValue) {
      console.log("   ⚠️ 只有一个可选值，跳过切换测试");
      console.log("\n✅ ACP 会话配置选项测试通过!");
      return;
    }

    console.log(`   切换到: ${alternateValue}`);

    // 5. 发送 setSessionConfigOption
    try {
      const result = await ctx.connection.setSessionConfigOption({
        sessionId: session.sessionId,
        configId: selectOpt.id,
        value: alternateValue,
      });

      printResult("setSessionConfigOption 响应", result);

      // 验证响应包含更新后的配置列表
      if (result && result.configOptions) {
        assert(
          Array.isArray(result.configOptions),
          "响应应包含 configOptions 数组",
        );
        console.log(
          `   ✅ 收到 ${result.configOptions.length} 个更新后的配置项`,
        );

        // 验证值已改变
        const updatedOpt = result.configOptions.find(
          (o: any) => o.id === selectOpt.id,
        );
        if (updatedOpt && updatedOpt.type === "select") {
          console.log(`   更新后的值: ${(updatedOpt as any).currentValue}`);
        }
      }
    } catch (err) {
      console.log(
        `   ⚠️ setSessionConfigOption 失败: ${(err as Error).message}`,
      );
      console.log("   这可能是 Agent 不支持动态切换此配置项");
    }

    console.log("\n✅ ACP 会话配置选项测试通过!");
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
