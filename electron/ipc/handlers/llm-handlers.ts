import { ipcMain, type BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type {
  LLMFetchModelsRequest,
  LLMFetchModelsResponse,
  LLMHealthCheckRequest,
  LLMHealthCheckResponse,
  LLMChatStreamRequest,
} from "../../../src/shared/ipc-types";
import { fetchModelList, generate, stream } from "../../services/llm";
import type { LLMProviderType } from "../../services/llm";

/** 活跃的流式请求，用于支持取消 */
const activeStreams = new Map<string, AbortController>();

/**
 * 注册 LLM 相关的 IPC handlers
 */
export function registerLLMHandlers(getWindow?: () => BrowserWindow | null) {
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

  // 流式聊天
  ipcMain.handle(
    IPC_CHANNELS.LLM_CHAT_STREAM,
    async (_event, request: LLMChatStreamRequest): Promise<{ ok: boolean }> => {
      const win = getWindow?.();
      if (!win) return { ok: false };

      const abortController = new AbortController();
      activeStreams.set(request.requestId, abortController);

      try {
        const result = await stream(
          {
            type: request.type as LLMProviderType,
            apiKey: request.apiKey,
            baseURL: request.baseURL,
          },
          {
            model: request.model,
            messages: request.messages,
            temperature: request.temperature,
            topP: request.topP,
            maxTokens: request.maxTokens,
            frequencyPenalty: request.frequencyPenalty,
            presencePenalty: request.presencePenalty,
            abortSignal: abortController.signal,
          },
        );

        // 异步消费 fullStream，区分 text-delta / reasoning-delta
        (async () => {
          try {
            for await (const part of result.fullStream) {
              if (abortController.signal.aborted) break;
              if (part.type === "text-delta") {
                win.webContents.send(IPC_CHANNELS.EVENT_LLM_STREAM_CHUNK, {
                  requestId: request.requestId,
                  text: part.textDelta,
                });
              } else if (part.type === "reasoning-delta") {
                win.webContents.send(IPC_CHANNELS.EVENT_LLM_STREAM_REASONING, {
                  requestId: request.requestId,
                  text: part.textDelta,
                });
              } else if (part.type === "finish") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const finishPart = part as any;
                win.webContents.send(IPC_CHANNELS.EVENT_LLM_STREAM_END, {
                  requestId: request.requestId,
                  usage: {
                    promptTokens: finishPart.totalUsage?.inputTokens ?? 0,
                    completionTokens: finishPart.totalUsage?.outputTokens ?? 0,
                    totalTokens: finishPart.totalUsage?.totalTokens ?? 0,
                  },
                  finishReason: finishPart.finishReason,
                });
              }
            }
          } catch (err) {
            if (!abortController.signal.aborted) {
              win.webContents.send(IPC_CHANNELS.EVENT_LLM_STREAM_ERROR, {
                requestId: request.requestId,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          } finally {
            activeStreams.delete(request.requestId);
          }
        })();

        return { ok: true };
      } catch (error) {
        activeStreams.delete(request.requestId);
        win.webContents.send(IPC_CHANNELS.EVENT_LLM_STREAM_ERROR, {
          requestId: request.requestId,
          error: error instanceof Error ? error.message : String(error),
        });
        return { ok: false };
      }
    },
  );

  // 取消流式聊天
  ipcMain.handle(
    IPC_CHANNELS.LLM_CHAT_CANCEL,
    async (_event, requestId: string): Promise<{ ok: boolean }> => {
      const controller = activeStreams.get(requestId);
      if (controller) {
        controller.abort();
        activeStreams.delete(requestId);
        return { ok: true };
      }
      return { ok: false };
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
