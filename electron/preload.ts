import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../src/shared/ipc-channels";

/**
 * 通过 contextBridge 安全暴露 IPC API 到渲染进程
 * 渲染进程通过 window.electronAPI 调用
 */
const electronAPI = {
  // ============ 请求/响应 (renderer → main) ============

  ping: () => ipcRenderer.invoke(IPC_CHANNELS.PING),

  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),

  // Agent 生命周期
  agentConnect: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_CONNECT, params),

  agentDisconnect: (params?: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_DISCONNECT, params),

  agentStatus: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_STATUS),

  // ACP 初始化
  acpInitialize: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.ACP_INITIALIZE, params),

  // 认证
  authenticate: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTHENTICATE, params),
  shellExec: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SHELL_EXEC, params),
  shellWrite: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SHELL_WRITE, params),
  onShellOutput: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on(IPC_CHANNELS.EVENT_SHELL_OUTPUT, callback);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SHELL_OUTPUT, callback);
    };
  },

  // 会话管理
  sessionNew: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_NEW, params),

  sessionLoad: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_LOAD, params),

  sessionList: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),

  // Prompt
  sessionPrompt: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_PROMPT, params),

  sessionCancel: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_CANCEL, params),

  // 会话配置
  sessionSetMode: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_MODE, params),

  sessionSetModel: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_MODEL, params),

  sessionSetConfig: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_CONFIG, params),

  // 权限响应
  permissionResponse: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_RESPONSE, params),

  // Skills
  skillInstall: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SKILL_INSTALL, params),

  skillList: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SKILL_LIST, params),

  skillRemove: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SKILL_REMOVE, params),

  // Storage
  storageGet: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_GET, params),
  storageSet: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_SET, params),
  storageDelete: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_DELETE, params),
  storageHas: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_HAS, params),
  storageClear: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_CLEAR, params),
  storageGetAll: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_GET_ALL, params),
  storageKeys: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_KEYS, params),
  storageSetMany: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_SET_MANY, params),
  storageGetInfo: () => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_GET_INFO),

  // 操作确认响应
  operationConfirmResponse: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.OPERATION_CONFIRM_RESPONSE, params),

  // MCP Server 管理
  mcpConnect: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_CONNECT, params),
  mcpDisconnect: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_DISCONNECT, params),
  mcpRefresh: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_REFRESH, params),
  mcpDisconnectAll: () => ipcRenderer.invoke(IPC_CHANNELS.MCP_DISCONNECT_ALL),

  // Agent 探测
  detectAgentCli: (params: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_DETECT_CLI, params),

  // 系统对话框
  selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),

  // ============ 事件监听 (main → renderer) ============

  onSessionUpdate: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on(IPC_CHANNELS.EVENT_SESSION_UPDATE, callback);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SESSION_UPDATE, callback);
    };
  },

  onPermissionRequest: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on(IPC_CHANNELS.EVENT_PERMISSION_REQUEST, callback);
    return () => {
      ipcRenderer.removeListener(
        IPC_CHANNELS.EVENT_PERMISSION_REQUEST,
        callback,
      );
    };
  },

  onAgentStatusChange: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on(IPC_CHANNELS.EVENT_AGENT_STATUS_CHANGE, callback);
    return () => {
      ipcRenderer.removeListener(
        IPC_CHANNELS.EVENT_AGENT_STATUS_CHANGE,
        callback,
      );
    };
  },

  onOperationConfirm: (callback: (event: unknown, data: unknown) => void) => {
    ipcRenderer.on(IPC_CHANNELS.EVENT_OPERATION_CONFIRM, callback);
    return () => {
      ipcRenderer.removeListener(
        IPC_CHANNELS.EVENT_OPERATION_CONFIRM,
        callback,
      );
    };
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
