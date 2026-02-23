/**
 * LLM Provider 工厂
 *
 * 根据协议类型创建对应的 AI SDK provider 实例
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAzure } from "@ai-sdk/azure";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOllama } from "ollama-ai-provider-v2";
import type { LanguageModel } from "ai";
import type { LLMProviderConfig } from "./types";

/**
 * 根据配置创建 AI SDK 的 LanguageModel 实例
 */
export function createLanguageModel(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  switch (config.type) {
    case "openai":
      return createOpenAIProvider(config, modelId);
    case "anthropic":
      return createAnthropicProvider(config, modelId);
    case "gemini":
      return createGeminiProvider(config, modelId);
    case "azure-openai":
      return createAzureProvider(config, modelId);
    case "ollama":
      return createOllamaProvider(config, modelId);
    case "openai-compatible":
      return createOpenAICompatibleProvider(config, modelId);
    case "open-responses":
      return createOpenResponsesProvider(config, modelId);
    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}

function createOpenAIProvider(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const provider = createOpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
  return provider(modelId);
}

function createAnthropicProvider(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const provider = createAnthropic({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
  return provider(modelId);
}

function createGeminiProvider(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const provider = createGoogleGenerativeAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
  return provider(modelId);
}

function createAzureProvider(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const provider = createAzure({
    apiKey: config.apiKey,
    resourceName: config.azureResourceName,
    ...(config.azureApiVersion ? { apiVersion: config.azureApiVersion } : {}),
  });
  return provider(modelId);
}

function createOllamaProvider(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const provider = createOllama({
    baseURL: config.baseURL || "http://localhost:11434/api",
  });
  return provider(modelId);
}

function createOpenAICompatibleProvider(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const provider = createOpenAICompatible({
    baseURL: config.baseURL || "",
    apiKey: config.apiKey,
    name: config.name || "openai-compatible",
  });
  return provider(modelId);
}

function createOpenResponsesProvider(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const provider = createOpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
  return provider.responses(modelId);
}
