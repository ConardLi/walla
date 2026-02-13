"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Database,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Loader2,
  HardDrive,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as ipc from "@/services/ipc-client";
import type { StorageInfo } from "@/shared/ipc-types";

export function StoragePanel() {
  // namespace 管理
  const [namespace, setNamespace] = useState("test");
  const [namespaceInfos, setNamespaceInfos] = useState<StorageInfo[]>([]);

  // CRUD 操作
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [queryKey, setQueryKey] = useState("");
  const [queryResult, setQueryResult] = useState<string | null>(null);

  // 批量设置
  const [batchJson, setBatchJson] = useState('{\n  "key1": "value1",\n  "key2": 42\n}');

  // 浏览数据
  const [allData, setAllData] = useState<Record<string, unknown> | null>(null);
  const [allKeys, setAllKeys] = useState<string[] | null>(null);

  // 状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (err: unknown) => {
    setError((err as Error).message);
    setSuccess(null);
  };

  // ============ 操作 ============

  const handleSet = useCallback(async () => {
    if (!namespace.trim() || !key.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      let parsed: unknown = value;
      try {
        parsed = JSON.parse(value);
      } catch {
        // 保持为字符串
      }
      await ipc.storageSet({ namespace: namespace.trim(), key: key.trim(), value: parsed });
      showSuccess(`已设置 ${namespace}/${key}`);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace, key, value]);

  const handleGet = useCallback(async () => {
    if (!namespace.trim() || !queryKey.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      const result = await ipc.storageGet({ namespace: namespace.trim(), key: queryKey.trim() });
      setQueryResult(
        result.value === undefined ? "(undefined)" : JSON.stringify(result.value, null, 2),
      );
      showSuccess(`已查询 ${namespace}/${queryKey}`);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace, queryKey]);

  const handleDelete = useCallback(async () => {
    if (!namespace.trim() || !queryKey.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      await ipc.storageDelete({ namespace: namespace.trim(), key: queryKey.trim() });
      showSuccess(`已删除 ${namespace}/${queryKey}`);
      setQueryResult(null);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace, queryKey]);

  const handleHas = useCallback(async () => {
    if (!namespace.trim() || !queryKey.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      const result = await ipc.storageHas({ namespace: namespace.trim(), key: queryKey.trim() });
      setQueryResult(result.exists ? "true (存在)" : "false (不存在)");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace, queryKey]);

  const handleClear = useCallback(async () => {
    if (!namespace.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      await ipc.storageClear({ namespace: namespace.trim() });
      showSuccess(`已清空命名空间 "${namespace}"`);
      setAllData(null);
      setAllKeys(null);
      setQueryResult(null);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  const handleGetAll = useCallback(async () => {
    if (!namespace.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      const result = await ipc.storageGetAll({ namespace: namespace.trim() });
      setAllData(result.data);
      showSuccess(`已加载 ${namespace} 全部数据`);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  const handleGetKeys = useCallback(async () => {
    if (!namespace.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      const result = await ipc.storageKeys({ namespace: namespace.trim() });
      setAllKeys(result.keys);
      showSuccess(`已加载 ${namespace} 全部 key (${result.keys.length} 个)`);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  const handleSetMany = useCallback(async () => {
    if (!namespace.trim() || !batchJson.trim()) return;
    clearMessages();
    setLoading(true);
    try {
      const data = JSON.parse(batchJson);
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        throw new Error("批量数据必须是一个 JSON 对象");
      }
      await ipc.storageSetMany({ namespace: namespace.trim(), data });
      showSuccess(`已批量设置 ${Object.keys(data).length} 个键值对到 "${namespace}"`);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [namespace, batchJson]);

  const handleGetInfo = useCallback(async () => {
    clearMessages();
    setLoading(true);
    try {
      const result = await ipc.storageGetInfo();
      setNamespaceInfos(result.namespaces);
      showSuccess(`已加载 ${result.namespaces.length} 个命名空间信息`);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopyValue = (k: string, v: unknown) => {
    navigator.clipboard.writeText(
      typeof v === "string" ? v : JSON.stringify(v, null, 2),
    );
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleExpand = (k: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleDeleteKey = async (k: string) => {
    if (!namespace.trim()) return;
    try {
      await ipc.storageDelete({ namespace: namespace.trim(), key: k });
      showSuccess(`已删除 ${namespace}/${k}`);
      // 刷新数据
      if (allData) {
        const result = await ipc.storageGetAll({ namespace: namespace.trim() });
        setAllData(result.data);
      }
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div className="space-y-3 max-w-3xl">
      {/* 说明 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            本地存储测试
          </CardTitle>
          <CardDescription className="text-xs">
            基于 electron-store 的本地持久化存储，支持按命名空间拆分多个独立存储库。
            每个命名空间对应一个独立的 JSON 文件。
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 命名空间选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              命名空间
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs px-2"
              onClick={handleGetInfo}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              刷新信息
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="命名空间名称，如: settings, cache, user-data"
              className="flex-1 text-xs font-mono"
            />
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              onClick={handleClear}
              disabled={!namespace.trim() || loading}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              清空
            </Button>
          </div>

          {/* 快捷命名空间 */}
          <div className="flex flex-wrap gap-1">
            {["test", "settings", "cache", "user-data", "sessions"].map((ns) => (
              <Button
                key={ns}
                size="sm"
                variant={namespace === ns ? "default" : "outline"}
                className="text-[10px] h-6 px-2"
                onClick={() => setNamespace(ns)}
              >
                {ns}
              </Button>
            ))}
          </div>

          {/* 命名空间信息 */}
          {namespaceInfos.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-muted-foreground">已有命名空间:</span>
              {namespaceInfos.map((info) => (
                <div
                  key={info.namespace}
                  className="flex items-center gap-2 p-1.5 rounded border text-[10px] cursor-pointer hover:bg-muted/50"
                  onClick={() => setNamespace(info.namespace)}
                >
                  <Database className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="font-mono font-medium">{info.namespace}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {info.size} 条
                  </Badge>
                  <span className="text-muted-foreground truncate flex-1 text-right font-mono">
                    {info.path}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 写入数据 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            写入数据
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr] gap-1.5">
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Key (支持 dot-path，如 user.name)"
              className="text-xs font-mono"
            />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Value (JSON 或字符串)'
              className="text-xs font-mono"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleSet}
            disabled={!namespace.trim() || !key.trim() || loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            设置 {namespace}/{key || "<key>"}
          </Button>
        </CardContent>
      </Card>

      {/* 批量写入 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            批量写入
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            value={batchJson}
            onChange={(e) => setBatchJson(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono min-h-[100px] max-h-[300px] resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder='{"key1": "value1", "key2": 42}'
          />
          <Button
            size="sm"
            className="w-full"
            onClick={handleSetMany}
            disabled={!namespace.trim() || !batchJson.trim() || loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            批量写入到 "{namespace}"
          </Button>
        </CardContent>
      </Card>

      {/* 查询数据 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            查询数据
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={queryKey}
              onChange={(e) => setQueryKey(e.target.value)}
              placeholder="Key (支持 dot-path)"
              className="flex-1 text-xs font-mono"
            />
            <Button size="sm" variant="outline" onClick={handleGet} disabled={!namespace.trim() || !queryKey.trim() || loading}>
              Get
            </Button>
            <Button size="sm" variant="outline" onClick={handleHas} disabled={!namespace.trim() || !queryKey.trim() || loading}>
              Has
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={!namespace.trim() || !queryKey.trim() || loading}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {queryResult !== null && (
            <pre className="rounded-md border bg-muted/50 p-2 text-xs font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-auto">
              {queryResult}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* 浏览全部数据 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              浏览数据
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={handleGetKeys}
                disabled={!namespace.trim() || loading}
              >
                Keys
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={handleGetAll}
                disabled={!namespace.trim() || loading}
              >
                全部数据
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Keys 列表 */}
          {allKeys !== null && allData === null && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">
                共 {allKeys.length} 个 key:
              </span>
              {allKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  命名空间为空
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {allKeys.map((k) => (
                    <Badge key={k} variant="secondary" className="text-[10px] font-mono">
                      {k}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 全部数据 */}
          {allData !== null && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">
                共 {Object.keys(allData).length} 条数据:
              </span>
              {Object.keys(allData).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  命名空间为空
                </p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-auto">
                  {Object.entries(allData).map(([k, v]) => {
                    const valueStr = typeof v === "string" ? v : JSON.stringify(v, null, 2);
                    const isComplex = typeof v === "object" && v !== null;
                    const isExpanded = expandedKeys.has(k);

                    return (
                      <div key={k} className="rounded border text-xs">
                        <div className="flex items-center gap-1.5 p-1.5">
                          {isComplex && (
                            <button
                              className="p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => toggleExpand(k)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </button>
                          )}
                          <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                            {k}
                          </span>
                          {!isComplex && (
                            <span className="text-muted-foreground truncate flex-1 font-mono">
                              = {valueStr}
                            </span>
                          )}
                          {isComplex && !isExpanded && (
                            <span className="text-muted-foreground truncate flex-1 font-mono">
                              {Array.isArray(v) ? `Array(${v.length})` : `Object(${Object.keys(v).length})`}
                            </span>
                          )}
                          <div className="flex gap-0.5 shrink-0">
                            <button
                              className="p-0.5 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopyValue(k, v)}
                            >
                              {copiedKey === k ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              className="p-0.5 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteKey(k)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {isComplex && isExpanded && (
                          <pre className="border-t bg-muted/30 p-1.5 font-mono text-[10px] whitespace-pre-wrap break-all max-h-[200px] overflow-auto">
                            {valueStr}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {allData === null && allKeys === null && (
            <p className="text-xs text-muted-foreground text-center py-2">
              点击上方按钮加载数据
            </p>
          )}
        </CardContent>
      </Card>

      {/* 状态消息 */}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-2 text-xs text-green-700 dark:text-green-300">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-2 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
