#!/usr/bin/env node
/**
 * Ollama Provider 测试脚本
 *
 * 测试 ollama-ai-provider-v2 的基本功能：
 * - generateText: 文本生成
 * - streamText: 流式文本生成
 *
 * 注意：需要本地运行 Ollama 服务
 * 安装模型示例: ollama pull llama3.2
 */

import { createOllama } from "ollama-ai-provider-v2";
import { generateText, streamText } from "ai";
import { config } from "../utils/config";
import {
  logSection,
  logSuccess,
  logError,
  logInfo,
  logResponse,
} from "../utils/logger";

const MODEL_NAME = "qwen3:1.7b";

async function testBasicGeneration(ollama: ReturnType<typeof createOllama>) {
  logSection("测试 1: 基础文本生成");

  try {
    const { text, usage } = await generateText({
      model: ollama(MODEL_NAME),
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

async function testStreamGeneration(ollama: ReturnType<typeof createOllama>) {
  logSection("测试 2: 流式文本生成");

  try {
    const { textStream } = await streamText({
      model: ollama(MODEL_NAME),
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
  console.log("🚀 开始测试 Ollama Provider\n");

  logInfo(`使用模型: ${MODEL_NAME}`);
  logInfo(`API 地址: ${config.ollama.baseURL}`);
  logInfo("确保 Ollama 服务正在运行并已安装模型\n");

  const ollama = createOllama({
    baseURL: config.ollama.baseURL,
  });

  try {
    await testBasicGeneration(ollama);
    await testStreamGeneration(ollama);

    console.log("\n✨ 所有测试通过！");
  } catch (error) {
    console.log("\n💥 测试失败");
    console.log("\n提示:");
    console.log("1. 确保 Ollama 服务正在运行: ollama serve");
    console.log(`2. 确保已安装模型: ollama pull ${MODEL_NAME}`);
    console.log("3. 检查 baseURL 配置是否正确");
    process.exit(1);
  }
}

main();
