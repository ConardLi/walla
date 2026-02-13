/**
 * 权限相关 IPC handlers: permission response + 事件转发
 *
 * 三种权限模式:
 * - default: 检查白名单，命中自动放行，否则弹窗询问
 * - auto:    所有操作自动批准
 * - manual:  所有操作弹窗询问
 */

import { ipcMain, type BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import type { ACPManagerRegistry } from "../../services/acp";
import type { RequestPermissionResponse } from "@agentclientprotocol/sdk";
import { storageManager } from "../../services/storage";

type WindowGetter = () => BrowserWindow | null;

// 存储待处理的权限请求 resolver
const pendingPermissions = new Map<
  string,
  (response: RequestPermissionResponse) => void
>();

function getApprovalMode(): string {
  try {
    return (storageManager.get("settings", "approvalMode") as string) ?? "auto";
  } catch {
    return "auto";
  }
}

function getWhitelist(key: string): string[] {
  try {
    return (storageManager.get("permissions", key) as string[] | null) ?? [];
  } catch {
    return [];
  }
}

/**
 * 从 options 中找到第一个 allow 类型的选项
 */
function findAutoApproveOption(
  options?: Array<{ optionId: string; kind?: string; name?: string }>,
): { optionId: string } | null {
  if (!options || options.length === 0) return null;
  const allowOnce = options.find((o) => o.kind === "allow_once");
  if (allowOnce) return allowOnce;
  const allowAlways = options.find((o) => o.kind === "allow_always");
  if (allowAlways) return allowAlways;
  return options[0];
}

/**
 * 检查 tool call 是否命中白名单
 */
function isWhitelisted(toolCall: Record<string, unknown> | undefined): boolean {
  if (!toolCall) return false;

  const toolName = (toolCall.title ??
    toolCall.name ??
    toolCall.tool ??
    "") as string;
  // ACP SDK 中输入参数字段为 rawInput
  let rawInput = toolCall.rawInput ?? toolCall.input;
  if (typeof rawInput === "string") {
    try {
      rawInput = JSON.parse(rawInput);
    } catch {
      /* ignore */
    }
  }
  const input = rawInput as Record<string, unknown> | undefined;
  const command = (input?.command ?? "") as string;

  // 工具白名单
  const toolWhitelist = getWhitelist("toolWhitelist");
  if (
    toolWhitelist.length > 0 &&
    toolName &&
    toolWhitelist.includes(toolName)
  ) {
    return true;
  }

  // 命令白名单（取命令第一段）
  const commandWhitelist = getWhitelist("commandWhitelist");
  if (commandWhitelist.length > 0 && command) {
    const baseCmd = command.split(/\s+/)[0];
    if (commandWhitelist.includes(baseCmd)) {
      return true;
    }
  }

  return false;
}

function autoApprove(
  request: { options?: Array<{ optionId: string; kind?: string }> },
  resolve: (response: RequestPermissionResponse) => void,
) {
  const option = findAutoApproveOption(request.options);
  if (option) {
    resolve({ outcome: { outcome: "selected", optionId: option.optionId } });
  } else {
    resolve({ outcome: { outcome: "cancelled" } });
  }
}

function forwardToUI(
  request: Record<string, unknown>,
  resolve: (response: RequestPermissionResponse) => void,
  getWindow: WindowGetter,
) {
  const requestId = `perm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pendingPermissions.set(requestId, resolve);

  const win = getWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.EVENT_PERMISSION_REQUEST, {
      requestId,
      sessionId: request.sessionId,
      toolCall: request.toolCall,
      options: request.options,
    });
  } else {
    autoApprove(
      request as { options?: Array<{ optionId: string; kind?: string }> },
      resolve,
    );
    pendingPermissions.delete(requestId);
  }
}

export function registerPermissionHandlers(
  registry: ACPManagerRegistry,
  getWindow: WindowGetter,
): void {
  // permission:response — 渲染进程回传权限决定
  ipcMain.handle(IPC_CHANNELS.PERMISSION_RESPONSE, async (_event, params) => {
    const { requestId, outcome } = params as {
      requestId: string;
      outcome: RequestPermissionResponse["outcome"];
    };
    const resolver = pendingPermissions.get(requestId);
    if (resolver) {
      resolver({ outcome });
      pendingPermissions.delete(requestId);
    }
    return { ok: true };
  });

  // operation:confirm-response — 保留 handler 防止渲染进程调用报错（已废弃）
  ipcMain.handle(IPC_CHANNELS.OPERATION_CONFIRM_RESPONSE, async () => ({
    ok: true,
  }));

  // 监听权限请求事件
  registry.events.on(
    "permission:request",
    ({
      request,
      resolve,
    }: {
      request: Record<string, unknown> & {
        options?: Array<{ optionId: string; kind?: string }>;
      };
      resolve: (response: RequestPermissionResponse) => void;
    }) => {
      console.log(
        "[Permission] Raw request from Agent:",
        JSON.stringify(request, null, 2),
      );
      const mode = getApprovalMode();

      // auto 模式：自动批准
      if (mode === "auto") {
        autoApprove(request, resolve);
        return;
      }

      // manual 模式：全部弹窗
      if (mode === "manual") {
        forwardToUI(request as Record<string, unknown>, resolve, getWindow);
        return;
      }

      // default 模式：白名单命中则自动放行，否则弹窗
      const toolCall = (request as Record<string, unknown>).toolCall as
        | Record<string, unknown>
        | undefined;
      if (isWhitelisted(toolCall)) {
        autoApprove(request, resolve);
      } else {
        forwardToUI(request as Record<string, unknown>, resolve, getWindow);
      }
    },
  );

  console.log("[IPC] Permission handlers registered");
}
