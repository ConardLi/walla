export interface TokenUsage {
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  thoughtTokens?: number;
  cachedReadTokens?: number;
}

export interface TokenUsageRecord {
  id: string;
  sessionId: string;
  agentName?: string;
  modelId?: string;
  modelName?: string;
  usage: TokenUsage;
  timestamp: number;
}
