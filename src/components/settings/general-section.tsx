"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Loader2, Globe, Monitor, Moon, Sun } from "lucide-react";
import * as ipc from "@/services/ipc-client";
import type { StorageInfo } from "@/shared/ipc-types";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** 不可清除的 namespace 列表 */
const PROTECTED_NAMESPACES = new Set(["agents"]);

const themeOptions: Array<{
  value: string;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "system", label: "跟随系统", icon: <Monitor className="h-4 w-4" /> },
  { value: "dark", label: "暗色模式", icon: <Moon className="h-4 w-4" /> },
  { value: "light", label: "亮色模式", icon: <Sun className="h-4 w-4" /> },
];

export function GeneralSection() {
  const { theme, setTheme } = useTheme();
  const [storageInfo, setStorageInfo] = useState<StorageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearingNs, setClearingNs] = useState<Set<string>>(new Set());

  const loadInfo = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ipc.storageGetInfo();
      setStorageInfo(result.namespaces ?? []);
    } catch {
      setStorageInfo([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const totalSize = storageInfo.reduce((sum, ns) => sum + ns.size, 0);
  const clearableSize = storageInfo
    .filter((ns) => !PROTECTED_NAMESPACES.has(ns.namespace))
    .reduce((sum, ns) => sum + ns.size, 0);

  const handleClearNamespace = async (namespace: string) => {
    setClearingNs((prev) => new Set(prev).add(namespace));
    try {
      await ipc.storageClear({ namespace });
      await loadInfo();
    } catch (err) {
      console.error("[GeneralSection] clear namespace failed:", err);
    } finally {
      setClearingNs((prev) => {
        const next = new Set(prev);
        next.delete(namespace);
        return next;
      });
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const clearable = storageInfo.filter(
        (ns) => !PROTECTED_NAMESPACES.has(ns.namespace),
      );
      await Promise.all(
        clearable.map((ns) => ipc.storageClear({ namespace: ns.namespace })),
      );
      await loadInfo();
    } catch (err) {
      console.error("[GeneralSection] clear cache failed:", err);
    }
    setClearing(false);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">通用设置</h2>

      {/* 主题设置 */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          主题外观
        </label>
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-colors",
                theme === opt.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 显示语言 */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-muted-foreground" />
          显示语言
        </label>
        <p className="text-sm text-muted-foreground">即将支持</p>
      </div>

      {/* 清除缓存 */}
      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          存储与缓存
        </label>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中…
          </div>
        ) : (
          <>
            {/* 存储明细 */}
            <div className="rounded-md border divide-y text-sm">
              {storageInfo.map((ns) => (
                <div
                  key={ns.namespace}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="text-muted-foreground">{ns.namespace}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">
                      {formatBytes(ns.size)}
                    </span>
                    {!PROTECTED_NAMESPACES.has(ns.namespace) && (
                      <button
                        type="button"
                        onClick={() => handleClearNamespace(ns.namespace)}
                        disabled={clearing || clearingNs.has(ns.namespace)}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        title="清除此缓存"
                      >
                        {clearingNs.has(ns.namespace) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 font-medium">
                <span>总计</span>
                <span className="font-mono text-xs">
                  {formatBytes(totalSize)}
                </span>
              </div>
            </div>

            {/* 清除按钮 */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearCache}
                disabled={clearing || clearableSize === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-destructive/50 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                清除缓存
              </button>
              <span className="text-xs text-muted-foreground">
                将清除 {formatBytes(clearableSize)} 数据（Agent
                连接配置不受影响）
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
