#!/usr/bin/env node
/**
 * Google Gemini Provider 测试脚本
 *
 * 测试 @ai-sdk/google 的基本功能：
 * - generateText: 文本生成
 * - streamText: 流式文本生成
 * - 工具调用 (Tool Calling)
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { config, checkEnvVar } from "../utils/config";
import {
  logSection,
  logSuccess,
  logError,
  logInfo,
  logResponse,
} from "../utils/logger";

const MODEL_NAME = config.gemini.model;

async function testBasicGeneration(
  provider: ReturnType<typeof createGoogleGenerativeAI>,
) {
  logSection("测试 1: 基础文本生成");

  try {
    const { text, usage } = await generateText({
      model: provider(MODEL_NAME),
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
  provider: ReturnType<typeof createGoogleGenerativeAI>,
) {
  logSection("测试 2: 流式文本生成");

  try {
    const { textStream } = await streamText({
      model: provider(MODEL_NAME),
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
  console.log("🚀 开始测试 Google Gemini Provider\n");

  if (!checkEnvVar("GOOGLE_GENERATIVE_AI_API_KEY", config.gemini.apiKey)) {
    logError("请在 .env 文件中设置 GOOGLE_GENERATIVE_AI_API_KEY");
    process.exit(1);
  }

  logInfo(`使用模型: ${MODEL_NAME}\n`);

  const google = createGoogleGenerativeAI({
    apiKey: config.gemini.apiKey,
    baseURL: config.gemini.baseURL,
  });

  try {
    await testBasicGeneration(google);
    await testStreamGeneration(google);

    console.log("\n✨ 所有测试通过！");
  } catch (error) {
    console.log("\n💥 测试失败");
    process.exit(1);
  }
}

main();
