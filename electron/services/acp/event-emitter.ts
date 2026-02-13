/**
 * 类型安全的 ACP 事件总线
 *
 * 用于 ACP 服务内部模块间通信，以及向渲染进程转发事件
 */

import type { ACPEventMap } from "./types";

type EventHandler<T> = (data: T) => void;

export class ACPEventEmitter {
  private listeners = new Map<string, Set<EventHandler<unknown>>>();

  on<K extends keyof ACPEventMap>(
    event: K,
    handler: EventHandler<ACPEventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(handler as EventHandler<unknown>);

    // 返回取消订阅函数
    return () => {
      set.delete(handler as EventHandler<unknown>);
    };
  }

  emit<K extends keyof ACPEventMap>(event: K, data: ACPEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[ACPEventEmitter] Error in handler for "${event}":`, err);
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
