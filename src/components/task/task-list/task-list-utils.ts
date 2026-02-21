import type { SessionMeta } from "@/types/session";
import type { TaskListSortMode } from "@/types/nav";

export function groupByTime(
  metas: SessionMeta[],
  sortMode: TaskListSortMode = "updated",
): Record<string, SessionMeta[]> {
  const groups: Record<string, SessionMeta[]> = {};
  const sorted = [...metas].sort((a, b) => {
    if (sortMode === "created") {
      return b.createdAt - a.createdAt;
    } else {
      return b.lastActiveAt - a.lastActiveAt;
    }
  });
  const now = new Date();

  for (const m of sorted) {
    const timestamp = sortMode === "created" ? m.createdAt : m.lastActiveAt;
    const d = new Date(timestamp);
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    let key: string;
    if (isToday) key = "今天";
    else if (isYesterday) key = "昨天";
    else
      key = d.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
      });

    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
}

export function groupByWorkspace(
  metas: SessionMeta[],
  sortMode: TaskListSortMode = "updated",
): Record<string, SessionMeta[]> {
  const groups: Record<string, SessionMeta[]> = {};
  for (const m of metas) {
    const dir = m.cwd.split("/").pop() ?? m.cwd;
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(m);
  }
  for (const key in groups) {
    groups[key].sort((a, b) => {
      if (sortMode === "created") {
        return b.createdAt - a.createdAt;
      } else {
        return b.lastActiveAt - a.lastActiveAt;
      }
    });
  }
  return groups;
}

export function groupByAgent(
  metas: SessionMeta[],
  sortMode: TaskListSortMode = "updated",
): Record<string, SessionMeta[]> {
  const groups: Record<string, SessionMeta[]> = {};
  for (const m of metas) {
    const key = m.agentName ?? "未知 Agent";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  for (const key in groups) {
    groups[key].sort((a, b) => {
      if (sortMode === "created") {
        return b.createdAt - a.createdAt;
      } else {
        return b.lastActiveAt - a.lastActiveAt;
      }
    });
  }
  return groups;
}
