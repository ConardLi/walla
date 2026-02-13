"use client";

import { memo } from "react";
import { useTokenUsageStore } from "@/stores/token-usage-store";
import { type TokenUsage } from "@/types/token-usage";

// ---------- token 格式化 ----------

function formatTokenCount(n: number): string {
  return n.toLocaleString("en-US");
}

function TokenLine({
  label,
  usage,
  total = false,
}: {
  label: string;
  usage: TokenUsage;
  total?: boolean;
}) {
  const parts: string[] = [];
  if (usage.inputTokens != null && !total)
    parts.push(`输入 ${formatTokenCount(usage.inputTokens)}`);
  if (usage.outputTokens != null && !total)
    parts.push(`输出 ${formatTokenCount(usage.outputTokens)}`);
  if (usage.cachedReadTokens != null && usage.cachedReadTokens > 0 && !total)
    parts.push(`缓存 ${formatTokenCount(usage.cachedReadTokens)}`);
  if (usage.totalTokens != null)
    parts.push((total ? "" : "共 ") + formatTokenCount(usage.totalTokens));
  if (!total) {
    parts.push(" ");
  }
  if (parts.length === 0) return null;
  return (
    <span className="text-[11px] text-muted-foreground">
      {label}
      {parts.join(" · ")}
    </span>
  );
}

// ---------- UsageBadge ----------

interface UsageBadgeProps {
  sessionId: string | null;
  latestUsage?: TokenUsage;
  stopReason: string | null;
  isPrompting: boolean;
}

export const UsageBadge = memo(function UsageBadge({
  sessionId,
  latestUsage,
  stopReason,
  isPrompting,
}: UsageBadgeProps) {
  const cumulative = useTokenUsageStore((s) =>
    sessionId ? s.cumulativeBySession[sessionId] : undefined,
  );

  if (isPrompting) return null;

  const hasLatest = latestUsage && stopReason;
  const hasCumulative =
    cumulative && cumulative.totalTokens && cumulative.totalTokens > 0;

  if (!hasLatest && !hasCumulative) return null;

  return (
    <div className="flex items-center justify-center gap-1 mt-2">
      {hasLatest && <TokenLine label="本次：" usage={latestUsage} />}
      {hasCumulative && <TokenLine label="累计：" total usage={cumulative} />}
    </div>
  );
});
