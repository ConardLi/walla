/**
 * Chat 模式类型定义（独立于 Agent 模式）
 */

export type ChatMessageRole = "user" | "assistant" | "error";

export interface ChatImage {
  data: string; // base64
  name: string; // 文件名
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  /** 思考过程文本（reasoning/thinking），仅 assistant 消息有 */
  reasoning?: string;
  /** 图片附件 */
  images?: ChatImage[];
  timestamp: number;
  isStreaming?: boolean;
  /** 是否正在流式输出思考过程 */
  isReasoningStreaming?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  /** 选中的模型提供商 ID */
  providerId: string;
  /** 选中的模型 ID */
  modelId: string;
  createdAt: number;
  updatedAt: number;
  /** 是否收藏 */
  favorited?: boolean;
}

export interface ChatModelSettings {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
}

export const DEFAULT_CHAT_SETTINGS: ChatModelSettings = {
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: "",
};
