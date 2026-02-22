#!/usr/bin/env node
/**
 * OpenAI Responses 测试脚本
 *
 * 测试使用 OpenAI Responses
 * - generateText: 文本生成
 * - streamText: 流式文本生成
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { config, checkEnvVar } from "../utils/config";
import {
  logSection,
  logSuccess,
  logError,
  logInfo,
  logResponse,
} from "../utils/logger";

async function testBasicGeneration(provider: ReturnType<typeof createOpenAI>) {
  logSection("测试 1: 基础文本生成");

  try {
    const { text, usage } = await generateText({
      model: provider.responses(config.openaiResponses.model),
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

async function testStreamGeneration(provider: ReturnType<typeof createOpenAI>) {
  logSection("测试 2: 流式文本生成");

  try {
    const { textStream } = await streamText({
      model: provider.responses(config.openaiResponses.model),
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
  console.log("🚀 开始测试 OpenAI Responses 接口\n");

  const isValid = [
    checkEnvVar("OPENAI_COMPATIBLE_BASE_URL", config.openaiResponses.baseURL),
    checkEnvVar("OPENAI_COMPATIBLE_API_KEY", config.openaiResponses.apiKey),
  ].every(Boolean);

  if (!isValid) {
    logError(
      "请在 .env 文件中设置 OPENAI_COMPATIBLE_BASE_URL 和 OPENAI_COMPATIBLE_API_KEY",
    );
    process.exit(1);
  }

  logInfo(`API 地址: ${config.openaiResponses.baseURL}`);
  logInfo(`使用模型: ${config.openaiResponses.model}\n`);

  const provider = createOpenAI({
    baseURL: config.openaiResponses.baseURL,
    apiKey: config.openaiResponses.apiKey,
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
