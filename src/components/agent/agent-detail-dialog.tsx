"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  FolderOpen,
  Shield,
  Clock,
  Zap,
  MessageSquare,
  Server,
  Key,
  Variable,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentConnection } from "@/types/agent";
import { APPROVAL_MODE_LABELS, APPROVAL_MODE_COLORS } from "./constants";

interface AgentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conn: AgentConnection | null;
}

export function AgentDetailDialog({
  open,
  onOpenChange,
  conn,
}: AgentDetailDialogProps) {
  if (!conn) return null;

  const meta = conn.initMeta;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conn.name}</DialogTitle>
          <DialogDescription>Agent 连接配置与运行时信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* 连接配置 */}
          <DetailSection title="连接配置">
            <DetailRow icon={Terminal} label="启动命令">
              <code className="font-mono text-xs">
                {conn.command} {conn.args?.join(" ")}
              </code>
            </DetailRow>
            {conn.cwd && (
              <DetailRow icon={FolderOpen} label="工作目录">
                <span className="text-xs truncate" title={conn.cwd}>
                  {conn.cwd}
                </span>
              </DetailRow>
            )}
            <DetailRow icon={Shield} label="权限模式">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  APPROVAL_MODE_COLORS[conn.approvalMode],
                )}
              >
                {APPROVAL_MODE_LABELS[conn.approvalMode]}
              </Badge>
            </DetailRow>
            <DetailRow icon={Clock} label="创建时间">
              <span className="text-xs">
                {new Date(conn.createdAt).toLocaleString()}
              </span>
            </DetailRow>
            <DetailRow icon={Clock} label="最近使用">
              <span className="text-xs">
                {new Date(conn.lastUsedAt).toLocaleString()}
              </span>
            </DetailRow>
          </DetailSection>

          {/* 环境变量 */}
          {conn.env && Object.keys(conn.env).length > 0 && (
            <DetailSection title="环境变量">
              <div className="space-y-1">
                {Object.entries(conn.env).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 text-xs font-mono"
                  >
                    <Variable className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{key}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="truncate" title={value}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* 运行时信息 */}
          {meta && (
            <>
              <DetailSection title="Agent 信息">
                {meta.agentInfo && (
                  <>
                    <DetailRow icon={Zap} label="名称">
                      <span className="text-xs font-medium">
                        {meta.agentInfo.name}
                      </span>
                    </DetailRow>
                    <DetailRow icon={Zap} label="版本">
                      <span className="text-xs">{meta.agentInfo.version}</span>
                    </DetailRow>
                  </>
                )}
                <DetailRow icon={Zap} label="协议版本">
                  <span className="text-xs">{meta.protocolVersion}</span>
                </DetailRow>
                <DetailRow icon={Clock} label="连接时间">
                  <span className="text-xs">
                    {new Date(meta.connectedAt).toLocaleString()}
                  </span>
                </DetailRow>
              </DetailSection>

              {/* 能力 */}
              {meta.agentCapabilities && (
                <DetailSection title="Agent 能力">
                  <CapabilityRow
                    label="加载会话"
                    enabled={meta.agentCapabilities.loadSession}
                  />
                  {meta.agentCapabilities.promptCapabilities && (
                    <div className="space-y-1 ml-0">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-2">
                        Prompt 能力
                      </p>
                      <CapabilityRow
                        label="嵌入上下文"
                        enabled={
                          meta.agentCapabilities.promptCapabilities
                            .embeddedContext
                        }
                      />
                      <CapabilityRow
                        label="图片支持"
                        enabled={
                          meta.agentCapabilities.promptCapabilities.image
                        }
                      />
                    </div>
                  )}
                  {meta.agentCapabilities.mcpCapabilities && (
                    <div className="space-y-1 ml-0">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-2">
                        MCP 能力
                      </p>
                      <CapabilityRow
                        label="HTTP"
                        enabled={
                          meta.agentCapabilities.mcpCapabilities.http
                        }
                      />
                      <CapabilityRow
                        label="SSE"
                        enabled={
                          meta.agentCapabilities.mcpCapabilities.sse
                        }
                      />
                    </div>
                  )}
                  {meta.agentCapabilities.sessionCapabilities && (
                    <div className="space-y-1 ml-0">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-2">
                        会话能力
                      </p>
                      <CapabilityRow
                        label="Fork"
                        enabled={
                          !!meta.agentCapabilities.sessionCapabilities.fork
                        }
                      />
                      <CapabilityRow
                        label="列表"
                        enabled={
                          !!meta.agentCapabilities.sessionCapabilities.list
                        }
                      />
                      <CapabilityRow
                        label="恢复"
                        enabled={
                          !!meta.agentCapabilities.sessionCapabilities.resume
                        }
                      />
                    </div>
                  )}
                </DetailSection>
              )}

              {/* 认证方式 */}
              {meta.authMethods && meta.authMethods.length > 0 && (
                <DetailSection title="认证方式">
                  {meta.authMethods.map((method) => (
                    <DetailRow key={method.id} icon={Key} label={method.name}>
                      {method.description && (
                        <span className="text-xs text-muted-foreground">
                          {method.description}
                        </span>
                      )}
                    </DetailRow>
                  ))}
                </DetailSection>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- 子组件 ----------

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 min-h-[24px]">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground shrink-0 w-20">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function CapabilityRow({
  label,
  enabled,
}: {
  label: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground/50" />
      )}
      <span
        className={cn(
          "text-xs",
          enabled ? "text-foreground" : "text-muted-foreground/50",
        )}
      >
        {label}
      </span>
    </div>
  );
}
