/**
 * LLM API 统一交互模块 - 类型定义
 *
 * 与业务逻辑解耦，仅定义 LLM 调用所需的类型
 */

// ============ 协议类型 ============

export type LLMProviderType =
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure-openai"
  | "ollama"
  | "openai-compatible"
  | "open-responses";

// ============ Provider 配置 ============

export interface LLMProviderConfig {
  /** API 协议类型 */
  type: LLMProviderType;
  /** API Key */
  apiKey?: string;
  /** API 基础地址 */
  baseURL?: string;
  /** 提供商名称（用于 openai-compatible） */
  name?: string;
  /** Azure 专用：资源名称 */
  azureResourceName?: string;
  /** Azure 专用：API 版本 */
  azureApiVersion?: string;
}

// ============ 消息类型 ============

export interface TextPart {
  type: "text";
  text: string;
}

export interface ImagePart {
  type: "image";
  /** base64 编码的图片数据或图片 URL */
  data: string;
  /** MIME 类型，如 image/png, image/jpeg */
  mimeType?: string;
}

export type MessagePart = TextPart | ImagePart;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | MessagePart[];
}

// ============ 调用参数 ============

export interface LLMGenerateOptions {
  /** 模型 ID */
  model: string;
  /** 简单文本提示（与 messages 二选一） */
  prompt?: string;
  /** 多轮对话消息（与 prompt 二选一） */
  messages?: ChatMessage[];
  /** 系统提示词 */
  system?: string;
  /** 温度参数 (0-2) */
  temperature?: number;
  /** Top-P 采样 */
  topP?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 停止序列 */
  stopSequences?: string[];
  /** 频率惩罚 */
  frequencyPenalty?: number;
  /** 存在惩罚 */
  presencePenalty?: number;
  /** 信号，用于取消请求 */
  abortSignal?: AbortSignal;
}

// ============ 返回类型 ============

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMGenerateResult {
  /** 生成的文本 */
  text: string;
  /** Token 使用量 */
  usage: LLMUsage;
  /** 停止原因 */
  finishReason: string;
}

export interface LLMStreamCallbacks {
  /** 收到文本片段 */
  onText?: (text: string) => void;
  /** 流式完成 */
  onFinish?: (result: LLMGenerateResult) => void;
  /** 发生错误 */
  onError?: (error: Error) => void;
}

export interface LLMStreamResult {
  /** 异步文本流迭代器 */
  textStream: AsyncIterable<string>;
  /** 等待完整结果的 Promise */
  result: Promise<LLMGenerateResult>;
}

// ============ 模型信息 ============

export interface LLMModelInfo {
  id: string;
  name?: string;
  created?: number;
}

export interface LLMModelListResult {
  models: LLMModelInfo[];
}
