export interface SessionMode {
  id: string;
  name: string;
  description?: string;
}

export interface SessionConfigOption {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  currentValue?: string;
  options?: unknown[];
}

export interface ModelInfo {
  modelId: string;
  name: string;
  description?: string | null;
}

export interface SessionInfo {
  sessionId: string;
  cwd: string;
  modes?: {
    availableModes: SessionMode[];
    currentModeId?: string;
  };
  models?: {
    availableModels: ModelInfo[];
    currentModelId?: string;
  };
  configOptions?: SessionConfigOption[];
  availableCommands?: Array<{
    name: string;
    description: string;
    input?: { hint: string };
  }>;
}

export interface SessionMeta {
  sessionId: string;
  cwd: string;
  agentConnectionId?: string;
  agentName?: string;
  modelId?: string;
  modelName?: string;
  title?: string;
  favorited?: boolean;
  createdAt: number;
  lastActiveAt: number;
}
