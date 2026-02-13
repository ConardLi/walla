"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Blocks, Plus } from "lucide-react";
import { useMCPStore } from "@/stores/mcp-store";
import type { MCPServerConfig } from "@/types/mcp";
import { ServerCard } from "./server-card";
import { AddServerDialog } from "./add-server-dialog";

export function MCPPage() {
  const servers = useMCPStore((s) => s.servers);
  const loaded = useMCPStore((s) => s.loaded);
  const loadServers = useMCPStore((s) => s.loadServers);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editServer, setEditServer] = useState<MCPServerConfig | null>(null);

  useEffect(() => {
    if (!loaded) {
      loadServers();
    }
  }, [loaded, loadServers]);

  const handleEdit = (server: MCPServerConfig) => {
    setEditServer(server);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditServer(null);
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
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Blocks className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium mb-1">尚未添加任何 MCP Server</p>
            <p className="text-xs mb-4">
              MCP Server 可以为 Agent 提供额外的工具、提示词和资源
            </p>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              添加 MCP Server
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* 添加/编辑弹框 */}
      <AddServerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editServer={editServer}
      />
    </div>
  );
}
