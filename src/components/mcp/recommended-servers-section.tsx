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

interface RecommendedServersSectionProps {
  onAddServer: (server: RecommendedMCPServer) => void;
}

export function RecommendedServersSection({
  onAddServer,
}: RecommendedServersSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const servers = useMCPStore((s) => s.servers);

  // 获取所有分类
  const categories = getMCPCategories();

  // 获取要显示的推荐 Servers
  const displayServers = selectedCategory
    ? getMCPServersByCategory(selectedCategory)
    : RECOMMENDED_MCP_SERVERS;

  // 检查某个推荐 Server 是否已添加
  const isServerAdded = (recommendedId: string) => {
    return servers.some((s) => s.id.includes(recommendedId));
  };

  return (
    <div className="space-y-4">
      {/* 标题和分类筛选 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">推荐 MCP Servers</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
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
