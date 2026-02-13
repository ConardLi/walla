/**
 * 本地存储管理器
 *
 * 基于 electron-store 封装，支持按命名空间拆分多个独立存储库。
 * 纯粹的存储能力层，不包含任何业务逻辑。
 */

import Store from "electron-store";

export interface StorageNamespaceOptions {
  /** 存储文件名（不含扩展名），默认与 namespace 同名 */
  fileName?: string;
  /** 默认值 */
  defaults?: Record<string, unknown>;
}

export class StorageManager {
  private stores = new Map<string, Store>();

  /**
   * 获取或创建指定命名空间的 Store 实例
   */
  private getStore(namespace: string): Store {
    let store = this.stores.get(namespace);
    if (!store) {
      store = new Store({ name: namespace });
      this.stores.set(namespace, store);
    }
    return store;
  }

  /**
   * 注册一个命名空间（可选，用于设置 defaults / fileName）
   */
  register(namespace: string, options?: StorageNamespaceOptions): void {
    if (this.stores.has(namespace)) return;
    const store = new Store({
      name: options?.fileName ?? namespace,
      defaults: options?.defaults,
    });
    this.stores.set(namespace, store);
  }

  // ============ CRUD 操作 ============

  /** 获取值，支持 dot-path */
  get(namespace: string, key: string): unknown {
    return this.getStore(namespace).get(key);
  }

  /** 设置值，支持 dot-path */
  set(namespace: string, key: string, value: unknown): void {
    this.getStore(namespace).set(key, value);
  }

  /** 批量设置 */
  setMany(namespace: string, data: Record<string, unknown>): void {
    const store = this.getStore(namespace);
    for (const [key, value] of Object.entries(data)) {
      store.set(key, value);
    }
  }

  /** 删除指定 key */
  delete(namespace: string, key: string): void {
    this.getStore(namespace).delete(key);
  }

  /** 检查 key 是否存在 */
  has(namespace: string, key: string): boolean {
    return this.getStore(namespace).has(key);
  }

  /** 清空指定命名空间的所有数据 */
  clear(namespace: string): void {
    this.getStore(namespace).clear();
  }

  /** 获取命名空间下的所有数据 */
  getAll(namespace: string): Record<string, unknown> {
    return this.getStore(namespace).store;
  }

  /** 获取命名空间下的所有 key */
  keys(namespace: string): string[] {
    const store = this.getStore(namespace);
    return Object.keys(store.store);
  }

  /** 获取存储文件路径 */
  getPath(namespace: string): string {
    return this.getStore(namespace).path;
  }

  /** 获取已注册的所有命名空间 */
  getNamespaces(): string[] {
    return Array.from(this.stores.keys());
  }

  /** 获取命名空间的条目数量 */
  size(namespace: string): number {
    return Object.keys(this.getStore(namespace).store).length;
  }
}

/** 全局单例 */
export const storageManager = new StorageManager();
