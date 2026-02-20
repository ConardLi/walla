"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Blocks, Plus, PackageOpen, ExternalLink } from "lucide-react";
import { useMCPStore } from "@/stores/mcp-store";
import type { MCPServerConfig } from "@/types/mcp";
import type { RecommendedMCPServer } from "@/constants/recommended-mcp-servers";
import { MCP_MARKETS } from "@/constants/mcp-markets";
import { ServerCard } from "./server-card";
import { AddServerDialog } from "./add-server-dialog";
import { RecommendedServersSection } from "./recommended-servers-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-chat-background">
      <Tabs
        defaultValue="recommended"
        className="flex-1 flex flex-col h-full overflow-hidden"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Blocks className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold tracking-tight">
                MCP Server
              </h1>
            </div>

            <TabsList className="bg-background/60 border">
              <TabsTrigger value="recommended" className="text-xs px-3">
                推荐 MCP
              </TabsTrigger>
              <TabsTrigger value="installed" className="text-xs px-3">
                已添加的 MCP
                {servers.length > 0 && (
                  <span className="ml-1.5 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full text-[10px] text-muted-foreground">
                    {servers.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="text-xs px-3">
                搜索 MCP
              </TabsTrigger>
            </TabsList>
          </div>

          <Button size="sm" onClick={handleAdd} className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            自定义添加
          </Button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden bg-muted/5">
          {/* 已添加列表 */}
          <TabsContent
            value="installed"
            className="h-full overflow-y-auto outline-none data-[state=inactive]:hidden"
          >
            <div className="px-6 py-6 max-w-5xl mx-auto">
              {servers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                    <PackageOpen className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    尚未添加 MCP Server
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
                    MCP Server 可以为 Agent 提供额外的工具、提示词和资源能力。
                    您可以从推荐市场选择，或手动添加自定义 Server。
                  </p>
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    手动添加 Server
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </TabsContent>

          {/* 推荐市场 */}
          <TabsContent
            value="recommended"
            className="h-full overflow-y-auto outline-none data-[state=inactive]:hidden"
          >
            <div className="px-6 py-6 max-w-5xl mx-auto">
              <RecommendedServersSection onAddServer={handleAddRecommended} />
            </div>
          </TabsContent>

          {/* MCP 市场 */}
          <TabsContent
            value="marketplace"
            className="h-full overflow-y-auto outline-none data-[state=inactive]:hidden"
          >
            <div className="px-6 py-6 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MCP_MARKETS.map((market) => (
                  <a
                    key={market.url}
                    href={market.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={market.logo}
                        alt={market.name}
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-lg font-semibold text-muted-foreground">${market.name.charAt(0).toUpperCase()}</span>`;
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {market.name}
                        </h3>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {market.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

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
