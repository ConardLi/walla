import type { ChatConversation } from "@/types/chat";
import type { ChatConvSortMode } from "@/stores/chat-store";

function sortConversations(
  convs: ChatConversation[],
  sortMode: ChatConvSortMode,
): ChatConversation[] {
  return [...convs].sort((a, b) => {
    if (sortMode === "created") return b.createdAt - a.createdAt;
    return b.updatedAt - a.updatedAt;
  });
}

export function groupByTime(
  convs: ChatConversation[],
  sortMode: ChatConvSortMode = "updated",
): Record<string, ChatConversation[]> {
  const groups: Record<string, ChatConversation[]> = {};
  const sorted = sortConversations(convs, sortMode);
  const now = new Date();

  for (const c of sorted) {
    const timestamp = sortMode === "created" ? c.createdAt : c.updatedAt;
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
      key = d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });

    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

export function groupByModel(
  convs: ChatConversation[],
  sortMode: ChatConvSortMode = "updated",
): Record<string, ChatConversation[]> {
  const groups: Record<string, ChatConversation[]> = {};
  for (const c of convs) {
    const key = c.modelId || "未知模型";
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  for (const key in groups) {
    groups[key] = sortConversations(groups[key], sortMode);
  }
  return groups;
}
