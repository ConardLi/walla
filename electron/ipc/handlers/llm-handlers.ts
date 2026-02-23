import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type {
  LLMFetchModelsRequest,
  LLMFetchModelsResponse,
  LLMHealthCheckRequest,
  LLMHealthCheckResponse,
} from "../../../src/shared/ipc-types";
import { fetchModelList, generate } from "../../services/llm";
import type { LLMProviderType } from "../../services/llm";

/**
 * 注册 LLM 相关的 IPC handlers
 */
export function registerLLMHandlers() {
  // 获取模型列表
  ipcMain.handle(
    IPC_CHANNELS.LLM_FETCH_MODELS,
    async (
      _event,
      request: LLMFetchModelsRequest,
    ): Promise<LLMFetchModelsResponse> => {
      try {
        const result = await fetchModelList({
          type: request.type as LLMProviderType,
          apiKey: request.apiKey,
          baseURL: request.baseURL,
          azureResourceName: request.azureResourceName,
          azureApiVersion: request.azureApiVersion,
        });
        return { models: result.models };
      } catch (error) {
        console.error("[LLM] Failed to fetch models:", error);
        return { models: [] };
      }
    },
  );

  // 健康检测
  ipcMain.handle(
    IPC_CHANNELS.LLM_HEALTH_CHECK,
    async (
      _event,
      request: LLMHealthCheckRequest,
    ): Promise<LLMHealthCheckResponse> => {
      const startTime = Date.now();
      try {
        await generate(
          {
            type: request.type as LLMProviderType,
            apiKey: request.apiKey,
            baseURL: request.baseURL,
            azureResourceName: request.azureResourceName,
            azureApiVersion: request.azureApiVersion,
          },
          {
            model: request.model,
            prompt: "Hi",
            maxTokens: 5,
          },
        );

        const latency = Date.now() - startTime;
        return { healthy: true, latency };
      } catch (error) {
        const latency = Date.now() - startTime;
        return {
          healthy: false,
          latency,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
}
