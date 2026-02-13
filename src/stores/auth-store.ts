/**
 * 认证弹框 Store
 *
 * 使用 Promise-based 模式：
 *   1. 业务逻辑调用 promptForAuth() → 弹出弹框，返回 Promise
 *   2. 用户在弹框中选择认证方式 → resolve(methodId)
 *   3. 用户取消 → resolve(null)
 */

import { create } from "zustand";
import type { AuthMethod } from "@/types/agent";

interface AuthState {
  /** 待选择的认证方式列表（非空时弹出弹框） */
  pendingAuthMethods: AuthMethod[];
  /** 需要认证的 Agent 名称 */
  pendingAgentName: string;
  /** 需要认证的 connectionId */
  pendingConnectionId: string;

  /** 用户选择了某个认证方式 */
  selectAuthMethod: (methodId: string) => void;
  /** 用户取消认证 */
  cancelAuth: () => void;
  /** 业务逻辑调用：弹出认证弹框并等待用户选择 */
  promptForAuth: (
    connectionId: string,
    agentName: string,
    authMethods: AuthMethod[],
  ) => Promise<string | null>;
}

/** 内部 resolver，不放到 Zustand state 中（函数不可序列化） */
let authResolver: ((methodId: string | null) => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  pendingAuthMethods: [],
  pendingAgentName: "",
  pendingConnectionId: "",

  promptForAuth: (connectionId, agentName, authMethods) => {
    return new Promise<string | null>((resolve) => {
      authResolver = resolve;
      set({
        pendingAuthMethods: authMethods,
        pendingAgentName: agentName,
        pendingConnectionId: connectionId,
      });
    });
  },

  selectAuthMethod: (methodId) => {
    if (authResolver) {
      authResolver(methodId);
      authResolver = null;
    }
    set({
      pendingAuthMethods: [],
      pendingAgentName: "",
      pendingConnectionId: "",
    });
  },

  cancelAuth: () => {
    if (authResolver) {
      authResolver(null);
      authResolver = null;
    }
    set({
      pendingAuthMethods: [],
      pendingAgentName: "",
      pendingConnectionId: "",
    });
  },
}));
