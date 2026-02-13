/**
 * 认证辅助工具
 *
 * 判断错误是否为需要认证的 -32000 错误，
 * 以及执行"弹框 → 认证 → 重试"流程
 */

import * as ipc from "@/services/ipc-client";
import { useAuthStore } from "@/stores/auth-store";
import { cleanErrorMessage } from "@/lib/error-utils";
import type { AuthMethod } from "@/types/agent";
import { AGENTS } from "@/constants/agent";

/**
 * 从 AGENTS 常量中获取预定义的 authMethods
 * 通过命令名或 Agent 名称匹配（conn.id 是 UUID，无法直接匹配常量中的 id）
 */
export function getPredefinedAuthMethods(
  command: string,
  name?: string,
): AuthMethod[] {
  const agent = AGENTS.find(
    (a) =>
      a.cli[0] === command ||
      (name && a.name.toLowerCase() === name.toLowerCase()),
  );
  return agent?.authMethods ?? [];
}

/**
 * 判断错误是否为需要认证的错误（-32000）
 */
export function isAuthRequiredError(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return (
    msg.toLowerCase().includes("authentication required") ||
    msg.includes("-32000")
  );
}

/**
 * 执行认证流程：弹出弹框让用户选择认证方式，然后调用 authenticate
 *
 * 如果选中的方法包含 _meta.terminal-auth，会先执行终端命令，
 * 命令成功后再调用 authenticate。
 *
 * @returns true 认证成功，false 用户取消
 * @throws 认证请求本身失败时抛出
 */
export async function performAuth(
  connectionId: string,
  agentName: string,
  authMethods: AuthMethod[],
): Promise<boolean> {
  const { promptForAuth } = useAuthStore.getState();

  const selectedMethodId = await promptForAuth(
    connectionId,
    agentName,
    authMethods,
  );

  if (!selectedMethodId) {
    return false;
  }

  try {
    await ipc.authenticate({ connectionId, methodId: selectedMethodId });
    return true;
  } catch (err) {
    const errMsg = cleanErrorMessage((err as Error).message);
    throw new Error(`认证失败：${errMsg}`);
  }
}
