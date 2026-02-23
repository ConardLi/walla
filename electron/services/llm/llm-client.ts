/**
 * LLM 统一调用客户端
 *
 * 封装 AI SDK 的 generateText / streamText，提供统一的调用接口
 */

import { generateText as aiGenerateText, streamText as aiStreamText } from "ai";
import { createLanguageModel } from "./provider-factory";
import type {
  LLMProviderConfig,
  LLMGenerateOptions,
  LLMGenerateResult,
  LLMStreamResult,
  LLMUsage,
  ChatMessage,
  MessagePart,
} from "./types";

/**
 * 将统一的 ChatMessage 转换为 AI SDK 的消息格式
 */
function toSDKMessages(messages: ChatMessage[]) {
  return messages.map((msg) => {
    if (typeof msg.content === "string") {
      return { role: msg.role, content: msg.content };
    }

    // 多模态消息：包含文本和图片
    const parts = msg.content.map((part: MessagePart) => {
      if (part.type === "text") {
        return { type: "text" as const, text: part.text };
      }
      if (part.type === "image") {
        // 判断是 URL 还是 base64
        if (
          part.data.startsWith("http://") ||
          part.data.startsWith("https://")
        ) {
          return { type: "image" as const, image: new URL(part.data) };
        }
        return {
          type: "image" as const,
          image: part.data,
          mimeType: part.mimeType,
        };
      }
      return { type: "text" as const, text: "" };
    });

    return { role: msg.role, content: parts };
  });
}

/**
 * 构建 AI SDK 调用参数
 */
function buildCallParams(
  config: LLMProviderConfig,
  options: LLMGenerateOptions,
) {
  const model = createLanguageModel(config, options.model);

  const params: Record<string, unknown> = { model };

  // prompt 和 messages 二选一
  if (options.messages && options.messages.length > 0) {
    params.messages = toSDKMessages(options.messages);
  } else if (options.prompt) {
    params.prompt = options.prompt;
  }

  if (options.system) params.system = options.system;
  if (options.temperature !== undefined)
    params.temperature = options.temperature;
  if (options.topP !== undefined) params.topP = options.topP;
  if (options.maxTokens !== undefined) params.maxTokens = options.maxTokens;
  if (options.stopSequences) params.stopSequences = options.stopSequences;
  if (options.frequencyPenalty !== undefined)
    params.frequencyPenalty = options.frequencyPenalty;
  if (options.presencePenalty !== undefined)
    params.presencePenalty = options.presencePenalty;
  if (options.abortSignal) params.abortSignal = options.abortSignal;

  return params;
}

/**
 * 将 AI SDK v6 的 LanguageModelUsage 转换为统一格式
 */
function normalizeUsage(usage: {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  totalTokens?: number | undefined;
}): LLMUsage {
  return {
    promptTokens: usage.inputTokens ?? 0,
    completionTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

/**
 * 文本生成（非流式）
 */
export async function generate(
  config: LLMProviderConfig,
  options: LLMGenerateOptions,
): Promise<LLMGenerateResult> {
  const params = buildCallParams(config, options);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await aiGenerateText(params as any);

  return {
    text: result.text,
    usage: normalizeUsage(result.usage),
    finishReason: result.finishReason,
  };
}

/**
 * 流式文本生成
 */
export async function stream(
  config: LLMProviderConfig,
  options: LLMGenerateOptions,
): Promise<LLMStreamResult> {
  const params = buildCallParams(config, options);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamResult = await aiStreamText(params as any);

  const resultPromise = (async (): Promise<LLMGenerateResult> => {
    let fullText = "";
    let usage: LLMUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    let finishReason = "unknown";

    for await (const part of streamResult.fullStream) {
      if (part.type === "text-delta") {
        fullText += part.text;
      } else if (part.type === "finish") {
        usage = normalizeUsage(part.totalUsage);
        finishReason = part.finishReason;
      }
    }

    return { text: fullText, usage, finishReason };
  })();

  return {
    textStream: streamResult.textStream,
    result: resultPromise,
  };
}
