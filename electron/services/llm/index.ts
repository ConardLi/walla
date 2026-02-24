/**
 * LLM 统一 API 交互模块
 *
 * 提供与业务逻辑解耦的 LLM 调用能力：
 * - generate: 文本生成（非流式）
 * - stream: 流式文本生成
 * - fetchModelList: 获取模型列表
 *
 * 支持的协议：
 * - openai: OpenAI 官方 API
 * - anthropic: Anthropic Claude API
 * - gemini: Google Gemini API
 * - azure-openai: Azure OpenAI API
 * - ollama: Ollama 本地模型
 * - openai-compatible: OpenAI 兼容协议（如硅基流动、DeepSeek 等）
 * - open-responses: OpenAI Responses API
 */

export { generate, stream } from "./llm-client";
export { fetchModelList } from "./model-list";
export { createLanguageModel } from "./provider-factory";

export type {
  LLMProviderType,
  LLMProviderConfig,
  LLMGenerateOptions,
  LLMGenerateResult,
  LLMStreamResult,
  LLMStreamCallbacks,
  LLMUsage,
  LLMModelInfo,
  LLMModelListResult,
  LLMMessage,
  MessagePart,
  TextPart,
} from "./types";
