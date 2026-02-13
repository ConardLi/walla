/**
 * MCP Client Manager
 *
 * 管理多个 MCP Server 连接，使用 @modelcontextprotocol/sdk
 * 支持 Stdio 和 SSE 两种传输方式
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type {
  MCPServerConfig,
  MCPConnectResponse,
  MCPTool,
  MCPPrompt,
  MCPResource,
} from "../../../src/types/mcp";

interface ManagedClient {
  client: Client;
  transport: StdioClientTransport | SSEClientTransport;
  config: MCPServerConfig;
}

export class MCPClientManager {
  private clients = new Map<string, ManagedClient>();

  async connect(config: MCPServerConfig): Promise<MCPConnectResponse> {
    // 如果已连接，先断开
    if (this.clients.has(config.id)) {
      await this.disconnect(config.id);
    }

    try {
      const client = new Client(
        { name: "desk-mcp-client", version: "1.0.0" },
        { capabilities: {} },
      );

      let transport: StdioClientTransport | SSEClientTransport;

      if (config.transportType === "stdio") {
        if (!config.command) {
          return { success: false, error: "Stdio 模式需要指定命令", tools: [], prompts: [], resources: [] };
        }
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args ?? [],
          env: config.env
            ? { ...process.env, ...config.env } as Record<string, string>
            : undefined,
        });
      } else if (config.transportType === "sse") {
        if (!config.url) {
          return { success: false, error: "SSE 模式需要指定 URL", tools: [], prompts: [], resources: [] };
        }
        transport = new SSEClientTransport(new URL(config.url));
      } else {
        return { success: false, error: `不支持的传输类型: ${config.transportType}`, tools: [], prompts: [], resources: [] };
      }

      await client.connect(transport);

      // 获取工具列表
      let tools: MCPTool[] = [];
      try {
        const toolsResult = await client.listTools();
        tools = (toolsResult.tools ?? []).map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema as Record<string, unknown> | undefined,
        }));
      } catch {
        // 服务器可能不支持工具
      }

      // 获取提示词列表
      let prompts: MCPPrompt[] = [];
      try {
        const promptsResult = await client.listPrompts();
        prompts = (promptsResult.prompts ?? []).map((p) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments?.map((a) => ({
            name: a.name,
            description: a.description,
            required: a.required,
          })),
        }));
      } catch {
        // 服务器可能不支持提示词
      }

      // 获取资源列表
      let resources: MCPResource[] = [];
      try {
        const resourcesResult = await client.listResources();
        resources = (resourcesResult.resources ?? []).map((r) => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        }));
      } catch {
        // 服务器可能不支持资源
      }

      const serverInfo = client.getServerVersion()
        ? {
            name: client.getServerVersion()?.name ?? "Unknown",
            version: client.getServerVersion()?.version ?? "Unknown",
          }
        : undefined;

      this.clients.set(config.id, { client, transport, config });

      console.log(
        `[MCP] Connected to ${config.name} (${config.id}), tools: ${tools.length}, prompts: ${prompts.length}, resources: ${resources.length}`,
      );

      return { success: true, tools, prompts, resources, serverInfo };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[MCP] Failed to connect to ${config.name}:`, errorMsg);
      return { success: false, error: errorMsg, tools: [], prompts: [], resources: [] };
    }
  }

  async disconnect(serverId: string): Promise<void> {
    const managed = this.clients.get(serverId);
    if (!managed) return;

    try {
      await managed.client.close();
    } catch (err) {
      console.warn(`[MCP] Error disconnecting ${serverId}:`, err);
    }
    this.clients.delete(serverId);
    console.log(`[MCP] Disconnected ${serverId}`);
  }

  async refresh(serverId: string): Promise<MCPConnectResponse> {
    const managed = this.clients.get(serverId);
    if (!managed) {
      return { success: false, error: "Server 未连接", tools: [], prompts: [], resources: [] };
    }

    try {
      let tools: MCPTool[] = [];
      try {
        const toolsResult = await managed.client.listTools();
        tools = (toolsResult.tools ?? []).map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema as Record<string, unknown> | undefined,
        }));
      } catch { /* ignore */ }

      let prompts: MCPPrompt[] = [];
      try {
        const promptsResult = await managed.client.listPrompts();
        prompts = (promptsResult.prompts ?? []).map((p) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments?.map((a) => ({
            name: a.name,
            description: a.description,
            required: a.required,
          })),
        }));
      } catch { /* ignore */ }

      let resources: MCPResource[] = [];
      try {
        const resourcesResult = await managed.client.listResources();
        resources = (resourcesResult.resources ?? []).map((r) => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        }));
      } catch { /* ignore */ }

      return { success: true, tools, prompts, resources };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg, tools: [], prompts: [], resources: [] };
    }
  }

  async disconnectAll(): Promise<void> {
    const ids = Array.from(this.clients.keys());
    for (const id of ids) {
      await this.disconnect(id);
    }
  }

  isConnected(serverId: string): boolean {
    return this.clients.has(serverId);
  }
}
