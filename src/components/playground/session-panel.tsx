"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Loader2, Download, Copy, Check } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore, selectAnyReady } from "@/stores/agent-store";
import { isElectron, selectDirectory } from "@/services/ipc-client";

export function SessionPanel() {
  const [cwd, setCwd] = useState("");
  const [loadSessionId, setLoadSessionId] = useState("");
  const [loadCwd, setLoadCwd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    sessions,
    activeSessionId,
    isCreating,
    createSession,
    loadSession,
    setActiveSession,
  } = useSessionStore();
  const isReady = useAgentStore(selectAnyReady);

  const handleCreate = async () => {
    if (!cwd.trim()) return;
    try {
      await createSession(cwd.trim());
    } catch {
      // error handled in store
    }
  };

  const handleLoadSession = async (sessionId: string, sessionCwd: string) => {
    if (!sessionId.trim() || !sessionCwd.trim()) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      await loadSession(sessionId.trim(), sessionCwd.trim());
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-3">
      {/* 新建会话 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">新建会话</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="工作目录路径"
              disabled={!isReady}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1"
            />
            {isElectron() && (
              <Button
                size="sm"
                variant="outline"
                disabled={!isReady}
                onClick={async () => {
                  const result = await selectDirectory();
                  if (result.path) setCwd(result.path);
                }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleCreate}
            disabled={!isReady || !cwd.trim() || isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            {isCreating ? "创建中..." : "创建会话"}
          </Button>
        </CardContent>
      </Card>

      {/* 加载历史会话 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            加载历史会话
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={loadSessionId}
            onChange={(e) => setLoadSessionId(e.target.value)}
            placeholder="输入 Session ID"
            disabled={!isReady || isLoading}
            className="font-mono text-xs"
          />
          <div className="flex gap-1.5">
            <Input
              value={loadCwd}
              onChange={(e) => setLoadCwd(e.target.value)}
              placeholder="工作目录路径"
              disabled={!isReady || isLoading}
              onKeyDown={(e) =>
                e.key === "Enter" && handleLoadSession(loadSessionId, loadCwd)
              }
              className="flex-1"
            />
            {isElectron() && (
              <Button
                size="sm"
                variant="outline"
                disabled={!isReady || isLoading}
                onClick={async () => {
                  const result = await selectDirectory();
                  if (result.path) setLoadCwd(result.path);
                }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => handleLoadSession(loadSessionId, loadCwd)}
            disabled={
              !isReady || !loadSessionId.trim() || !loadCwd.trim() || isLoading
            }
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {isLoading ? "加载中..." : "加载会话"}
          </Button>
          {loadError && <p className="text-xs text-destructive">{loadError}</p>}
        </CardContent>
      </Card>

      {/* 会话列表 */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              会话列表 ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              <div className="space-y-1 p-3 pt-0">
                {sessions.map((session) => {
                  const isActive = session.sessionId === activeSessionId;
                  return (
                    <div
                      key={session.sessionId}
                      className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {/* Session ID 行 */}
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] break-all flex-1 select-all">
                          {session.sessionId}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyId(session.sessionId);
                          }}
                          className="shrink-0 p-0.5 rounded hover:bg-muted-foreground/10"
                          title="复制 Session ID"
                        >
                          {copiedId === session.sessionId ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>

                      {/* 工作目录 */}
                      <div className="text-muted-foreground truncate mt-1">
                        <FolderOpen className="h-3 w-3 inline mr-1" />
                        {session.cwd}
                      </div>

                      {/* 标签行 */}
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {isActive && (
                          <Badge
                            variant="default"
                            className="text-[10px] px-1 py-0"
                          >
                            active
                          </Badge>
                        )}
                        {session.modes?.currentModeId && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            {session.modes.currentModeId}
                          </Badge>
                        )}
                        {session.models?.currentModelId && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            {session.models.currentModelId}
                          </Badge>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-1 mt-1.5">
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-2"
                            onClick={() => setActiveSession(session.sessionId)}
                          >
                            切换
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          disabled={!isReady || isLoading}
                          onClick={() =>
                            handleLoadSession(session.sessionId, session.cwd)
                          }
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          加载历史
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
