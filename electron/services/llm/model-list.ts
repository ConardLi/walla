/**
 * 获取模型列表
 *
 * 通过各协议的 API 获取可用模型列表
 * 注意：并非所有协议都支持获取模型列表
 */

import type { LLMProviderConfig, LLMModelInfo, LLMModelListResult } from "./types";

/**
 * 获取指定提供商的可用模型列表
 *
 * 支持的协议：openai, openai-compatible, open-responses, ollama
 * 不支持的协议（anthropic, gemini, azure-openai）会返回空列表
 */
export async function fetchModelList(
  config: LLMProviderConfig,
): Promise<LLMModelListResult> {
  switch (config.type) {
    case "openai":
    case "openai-compatible":
    case "open-responses":
      return fetchOpenAIModels(config);
    case "ollama":
      return fetchOllamaModels(config);
    case "anthropic":
    case "gemini":
    case "azure-openai":
      // 这些协议不支持通过 API 获取模型列表
      return { models: [] };
    default:
      return { models: [] };
  }
}

/**
 * 通过 OpenAI 兼容的 /models 接口获取模型列表
 */
async function fetchOpenAIModels(
  config: LLMProviderConfig,
): Promise<LLMModelListResult> {
  const baseURL = config.baseURL?.replace(/\/+$/, "") || "https://api.openai.com/v1";
  const url = `${baseURL}/models`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    data?: Array<{ id: string; created?: number; owned_by?: string }>;
  };

  const models: LLMModelInfo[] = (data.data || []).map((m) => ({
    id: m.id,
    name: m.id,
    created: m.created,
  }));

  // 按 id 排序
  models.sort((a, b) => a.id.localeCompare(b.id));

  return { models };
}

/**
 * 通过 Ollama API 获取本地模型列表
 */
async function fetchOllamaModels(
  config: LLMProviderConfig,
): Promise<LLMModelListResult> {
  // Ollama 的 API 路径是 /api/tags，但 baseURL 可能已经包含 /api
  const baseURL = config.baseURL?.replace(/\/+$/, "") || "http://localhost:11434/api";
  // 如果 baseURL 以 /api 结尾，使用 /tags；否则使用 /api/tags
  const url = baseURL.endsWith("/api")
    ? `${baseURL}/tags`
    : `${baseURL}/api/tags`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Ollama models: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    models?: Array<{
      name: string;
      modified_at?: string;
      size?: number;
    }>;
  };

  const models: LLMModelInfo[] = (data.models || []).map((m) => ({
    id: m.name,
    name: m.name,
  }));

  return { models };
}
