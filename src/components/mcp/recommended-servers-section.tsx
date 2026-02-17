"use client";

import { useState } from "react";
import { RecommendedServerCard } from "./recommended-server-card";
import {
  RECOMMENDED_MCP_SERVERS,
  getMCPCategories,
  getMCPServersByCategory,
  type RecommendedMCPServer,
} from "@/constants/recommended-mcp-servers";
import { useMCPStore } from "@/stores/mcp-store";
import { Search } from "lucide-react";

interface RecommendedServersSectionProps {
  onAddServer: (server: RecommendedMCPServer) => void;
}

export function RecommendedServersSection({
  onAddServer,
}: RecommendedServersSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const servers = useMCPStore((s) => s.servers);

  // 获取所有分类
  const categories = getMCPCategories();

  // 获取要显示的推荐 Servers
  let displayServers = selectedCategory
    ? getMCPServersByCategory(selectedCategory)
    : RECOMMENDED_MCP_SERVERS;

  // 搜索过滤
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    displayServers = displayServers.filter(
      (server) =>
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query),
    );
  }

  // 检查某个推荐 Server 是否已添加
  const isServerAdded = (recommendedId: string) => {
    return servers.some((s) => s.id.includes(recommendedId));
  };

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索推荐 Server..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* 分类筛选 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 推荐列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayServers.map((server) => (
          <RecommendedServerCard
            key={server.id}
            server={server}
            onAdd={onAddServer}
            isAdded={isServerAdded(server.id)}
          />
        ))}
      </div>

      {displayServers.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          该分类下暂无推荐 Server
        </div>
      )}
    </div>
  );
}
