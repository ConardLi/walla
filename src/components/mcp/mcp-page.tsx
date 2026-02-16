"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Blocks, Plus } from "lucide-react";
import { useMCPStore } from "@/stores/mcp-store";
import type { MCPServerConfig } from "@/types/mcp";
import type { RecommendedMCPServer } from "@/constants/recommended-mcp-servers";
import { ServerCard } from "./server-card";
import { AddServerDialog } from "./add-server-dialog";
import { RecommendedServersSection } from "./recommended-servers-section";

export function MCPPage() {
  const servers = useMCPStore((s) => s.servers);
  const loaded = useMCPStore((s) => s.loaded);
  const loadServers = useMCPStore((s) => s.loadServers);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editServer, setEditServer] = useState<MCPServerConfig | null>(null);
  const [recommendedServer, setRecommendedServer] =
    useState<RecommendedMCPServer | null>(null);

  useEffect(() => {
    if (!loaded) {
      loadServers();
    }
  }, [loaded, loadServers]);

  const handleEdit = (server: MCPServerConfig) => {
    setEditServer(server);
    setRecommendedServer(null);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditServer(null);
    setRecommendedServer(null);
    setDialogOpen(true);
  };

  const handleAddRecommended = (server: RecommendedMCPServer) => {
    setEditServer(null);
    setRecommendedServer(server);
    setDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Blocks className="h-5 w-5" />
          <h1 className="text-lg font-semibold">MCP Server</h1>
          {servers.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({servers.length})
            </span>
          )}
        </div>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {/* 推荐 MCP Servers */}
          <RecommendedServersSection onAddServer={handleAddRecommended} />

          {/* 已添加的 MCP Servers */}
          {servers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">已添加的 MCP Servers</h3>
              <div className="space-y-3">
                {servers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑弹框 */}
      <AddServerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editServer={editServer}
        recommendedServer={recommendedServer}
      />
    </div>
  );
}
