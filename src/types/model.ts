/**
 * 模型提供商 API 协议类型
 */
export type ProviderType =
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure-openai"
  | "ollama"
  | "openai-compatible"
  | "open-responses";

/**
 * 模型能力标签
 */
export type ModelType =
  | "chat"
  | "vision"
  | "embedding"
  | "reasoning"
  | "function_calling"
  | "web_search"
  | "image_generation";

/**
 * 单个模型定义
 */
export interface Model {
  /** 模型 ID（调用 API 时使用） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 所属提供商 ID */
  providerId: string;
  /** 分组名称（如 GPT-4, Claude 3 等） */
  group?: string;
  /** 能力标签 */
  capabilities?: ModelType[];
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 用户配置的提供商基础信息（不包含模型列表）
 */
export interface ProviderUserConfig {
  /** 提供商 ID */
  id: string;
  /** API Key */
  apiKey: string;
  /** API 地址 */
  apiHost?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 自定义模型启用状态 */
  modelEnabledStates?: Record<string, boolean>;
}

/**
 * 模型提供商定义
 */
export interface ModelProvider {
  id: string;
  name: string;
  type: ProviderType;
  apiKey: string;
  apiHost: string;
  apiVersion?: string;
  icon?: string;
  models: Model[];
  enabled: boolean;
  isSystem?: boolean;
  notes?: string;
}
