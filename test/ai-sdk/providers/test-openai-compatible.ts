#!/usr/bin/env node
/**
 * OpenAI 兼容协议测试脚本
 *
 * 测试使用 OpenAI 兼容接口的第三方提供商（如硅基流动、DeepSeek 等）
 * - generateText: 文本生成
 * - streamText: 流式文本生成
 * - 工具调用 (Tool Calling)
 */

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { config, checkEnvVar } from "../utils/config";
import {
  logSection,
  logSuccess,
  logError,
  logInfo,
  logResponse,
} from "../utils/logger";

async function testBasicGeneration(
  provider: ReturnType<typeof createOpenAICompatible>,
) {
  logSection("测试 1: 基础文本生成");

  try {
    const { text, usage } = await generateText({
      model: provider(config.openaiCompatible.model),
      prompt: "用一句话介绍人工智能",
    });

    logResponse("生成的文本", text);
    logInfo(`使用的 tokens: ${usage.totalTokens}`);
    logSuccess("基础文本生成测试通过");
  } catch (error) {
    logError("基础文本生成测试失败", error);
    throw error;
  }
}

async function testStreamGeneration(
  provider: ReturnType<typeof createOpenAICompatible>,
) {
  logSection("测试 2: 流式文本生成");

  try {
    const { textStream } = await streamText({
      model: provider(config.openaiCompatible.model),
      prompt: "写一首关于编程的短诗",
    });

    process.stdout.write("📝 流式输出: ");
    for await (const textPart of textStream) {
      process.stdout.write(textPart);
    }
    process.stdout.write("\n");

    logSuccess("流式文本生成测试通过");
  } catch (error) {
    logError("流式文本生成测试失败", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 开始测试 OpenAI 兼容接口\n");

  const isValid = [
    checkEnvVar("OPENAI_COMPATIBLE_BASE_URL", config.openaiCompatible.baseURL),
    checkEnvVar("OPENAI_COMPATIBLE_API_KEY", config.openaiCompatible.apiKey),
  ].every(Boolean);

  if (!isValid) {
    logError(
      "请在 .env 文件中设置 OPENAI_COMPATIBLE_BASE_URL 和 OPENAI_COMPATIBLE_API_KEY",
    );
    process.exit(1);
  }

  logInfo(`API 地址: ${config.openaiCompatible.baseURL}`);
  logInfo(`使用模型: ${config.openaiCompatible.model}\n`);

  const provider = createOpenAICompatible({
    baseURL: config.openaiCompatible.baseURL,
    apiKey: config.openaiCompatible.apiKey,
    name: "openai-compatible",
  });

  try {
    await testBasicGeneration(provider);
    await testStreamGeneration(provider);

    console.log("\n✨ 核心测试通过！");
  } catch (error) {
    console.log("\n💥 测试失败");
    process.exit(1);
  }
}

main();
