"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ChevronRight,
  Loader2,
  Terminal,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import * as ipc from "@/services/ipc-client";
import { cleanErrorMessage } from "@/lib/error-utils";
import { useShellInput } from "./use-shell-input";
import { AGENTS } from "@/constants/agent";

export function AuthMethodDialog() {
  const { pendingAuthMethods, pendingAgentName, selectAuthMethod, cancelAuth } =
    useAuthStore();

  const [authenticating, setAuthenticating] = useState<string | null>(null);
  const [commandOutput, setCommandOutput] = useState<{
    status: "running" | "success" | "error";
    output: string;
    error?: string;
  } | null>(null);
  const open = pendingAuthMethods.length > 0;
  const needsAuthInput = AGENTS.some(
    (a) =>
      a.name.toLowerCase() === pendingAgentName.toLowerCase() && a.authInput,
  );
  const outputRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shellInput = useShellInput();

  // 监听 shell 实时输出事件
  useEffect(() => {
    if (!isRunningRef.current) return;

    const unsubscribe = ipc.onShellOutput((data) => {
      setCommandOutput((prev) => {
        if (!prev || prev.status !== "running") return prev;
        return { ...prev, output: prev.output + data.data };
      });
    });

    return unsubscribe;
  }, [authenticating]);

  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [commandOutput?.output]);

  // 命令运行时自动聚焦输入框
  useEffect(() => {
    if (commandOutput?.status === "running" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandOutput?.status]);

  const handleSelect = useCallback(
    async (methodId: string) => {
      const method = pendingAuthMethods.find((m) => m.id === methodId);
      const terminalAuth = method?._meta?.["terminal-auth"];

      if (terminalAuth) {
        setAuthenticating(methodId);
        setCommandOutput({ status: "running", output: "" });
        isRunningRef.current = true;
        shellInput.reset();

        try {
          const result = await ipc.shellExec({
            command: terminalAuth.command,
            args: terminalAuth.args,
          });

          isRunningRef.current = false;

          if (result.exitCode === 0) {
            setCommandOutput((prev) => ({
              status: "success",
              output: prev?.output || result.stdout || "命令执行成功",
            }));
            setTimeout(() => {
              selectAuthMethod(methodId);
              setCommandOutput(null);
              setAuthenticating(null);
              shellInput.reset();
            }, 800);
          } else {
            setCommandOutput((prev) => ({
              status: "error",
              output:
                prev?.output || result.stderr || result.stdout || "未知错误",
              error: `命令执行失败（exit ${result.exitCode}）`,
            }));
            setAuthenticating(null);
          }
        } catch (err) {
          isRunningRef.current = false;
          const errMsg = cleanErrorMessage((err as Error).message);
          setCommandOutput((prev) => ({
            status: "error",
            output: prev?.output || errMsg,
            error: "命令执行异常",
          }));
          setAuthenticating(null);
        }
      } else {
        setAuthenticating(methodId);
        selectAuthMethod(methodId);
        setTimeout(() => setAuthenticating(null), 300);
      }
    },
    [pendingAuthMethods, selectAuthMethod, shellInput],
  );

  const handleCancel = () => {
    isRunningRef.current = false;
    setAuthenticating(null);
    setCommandOutput(null);
    shellInput.reset();
    cancelAuth();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <DialogTitle>需要认证</DialogTitle>
          </div>
          <DialogDescription>
            <strong>{pendingAgentName}</strong>{" "}
            需要认证后才能继续使用，请选择一种认证方式：
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {pendingAuthMethods.map((method) => (
            <button
              key={method.id}
              disabled={authenticating !== null}
              onClick={() => handleSelect(method.id)}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  {method._meta?.["terminal-auth"] && (
                    <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{method.name}</span>
                </div>
                {method.description && (
                  <span className="text-xs text-muted-foreground">
                    {method.description}
                  </span>
                )}
                {method._meta?.["terminal-auth"] && (
                  <span className="text-xs text-muted-foreground/70">
                    将自动执行终端命令进行认证
                  </span>
                )}
              </div>
              {authenticating === method.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ))}

          {/* 命令输出显示区域 */}
          {commandOutput && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                {commandOutput.status === "running" && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {commandOutput.status === "success" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {commandOutput.status === "error" && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {commandOutput.status === "running" && "正在执行终端命令..."}
                  {commandOutput.status === "success" && "命令执行成功"}
                  {commandOutput.status === "error" && "命令执行失败"}
                </span>
              </div>
              {commandOutput.error && (
                <div className="text-xs text-red-600 mb-1">
                  {commandOutput.error}
                </div>
              )}
              {commandOutput.output && (
                <div
                  ref={outputRef}
                  className="rounded bg-black/80 p-2 text-xs text-green-400 font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto"
                >
                  {commandOutput.output}
                </div>
              )}

              {/* stdin 输入框：仅 authInput=true 的 Agent 显示 */}
              {needsAuthInput && commandOutput.status === "running" && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={shellInput.inputValue}
                    onChange={(e) => shellInput.setInputValue(e.target.value)}
                    onKeyDown={shellInput.handleKeyDown}
                    placeholder="输入内容并按 Enter 发送..."
                    disabled={shellInput.sending}
                    className="flex-1 bg-black/60 text-green-400 text-xs font-mono rounded px-2 py-1.5 border border-muted-foreground/20 placeholder:text-muted-foreground/40 focus:outline-none focus:border-green-500/50"
                  />
                  <button
                    onClick={shellInput.sendInput}
                    disabled={
                      shellInput.sending || !shellInput.inputValue.trim()
                    }
                    className="p-1.5 rounded hover:bg-muted-foreground/20 disabled:opacity-30 transition-colors"
                    title="发送"
                  >
                    <Send className="h-3.5 w-3.5 text-green-400" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={commandOutput?.status === "running"}
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
