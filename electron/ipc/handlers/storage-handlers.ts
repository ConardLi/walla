/**
 * Storage IPC Handlers
 *
 * 将渲染进程的存储请求转发到 StorageManager
 */

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";
import { storageManager } from "../../services/storage";

export function registerStorageHandlers() {
  ipcMain.handle(IPC_CHANNELS.STORAGE_GET, async (_event, params) => {
    const { namespace, key } = params as { namespace: string; key: string };
    const value = storageManager.get(namespace, key);
    return { value };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_SET, async (_event, params) => {
    const { namespace, key, value } = params as {
      namespace: string;
      key: string;
      value: unknown;
    };
    storageManager.set(namespace, key, value);
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_DELETE, async (_event, params) => {
    const { namespace, key } = params as { namespace: string; key: string };
    storageManager.delete(namespace, key);
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_HAS, async (_event, params) => {
    const { namespace, key } = params as { namespace: string; key: string };
    const exists = storageManager.has(namespace, key);
    return { exists };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_CLEAR, async (_event, params) => {
    const { namespace } = params as { namespace: string };
    storageManager.clear(namespace);
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_ALL, async (_event, params) => {
    const { namespace } = params as { namespace: string };
    const data = storageManager.getAll(namespace);
    return { data };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_KEYS, async (_event, params) => {
    const { namespace } = params as { namespace: string };
    const keys = storageManager.keys(namespace);
    return { keys };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_SET_MANY, async (_event, params) => {
    const { namespace, data } = params as {
      namespace: string;
      data: Record<string, unknown>;
    };
    storageManager.setMany(namespace, data);
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_INFO, async () => {
    const namespaces = storageManager.getNamespaces().map((ns) => ({
      namespace: ns,
      path: storageManager.getPath(ns),
      size: storageManager.size(ns),
    }));
    return { namespaces };
  });

  console.log("[IPC] Storage handlers registered");
}
