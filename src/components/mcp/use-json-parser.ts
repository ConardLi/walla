import type { MCPTransportType } from "@/types/mcp";
import type { ServerFormData } from "./server-form";

interface ParsedServer {
  name: string;
  description?: string;
  transportType: MCPTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

interface ParseResult {
  success: boolean;
  servers: ParsedServer[];
  error?: string;
}

/**
 * 解析 MCP JSON 配置
 * 支持格式：
 * { "mcpServers": { "name": { "command": "...", "args": [...] } } }
 * { "mcpServers": { "name": { "type": "sse", "url": "..." } } }
 */
export function parseMCPJson(jsonStr: string): ParseResult {
  try {
    const parsed = JSON.parse(jsonStr);

    let serversObj: Record<string, Record<string, unknown>>;

    if (parsed.mcpServers && typeof parsed.mcpServers === "object") {
      serversObj = parsed.mcpServers;
    } else if (typeof parsed === "object" && !Array.isArray(parsed)) {
      // 尝试直接作为 server 配置解析
      const keys = Object.keys(parsed);
      if (
        keys.includes("command") ||
        keys.includes("url") ||
        keys.includes("type")
      ) {
        serversObj = { server: parsed };
      } else {
        serversObj = parsed;
      }
    } else {
      return { success: false, servers: [], error: "无效的 JSON 格式" };
    }

    const servers: ParsedServer[] = [];

    for (const [name, config] of Object.entries(serversObj)) {
      if (!config || typeof config !== "object") continue;

      const type = config.type as string | undefined;
      const description = config.description as string | undefined;
      if (type === "sse" || config.url) {
        servers.push({
          name,
          description,
          transportType: "sse",
          url: config.url as string,
        });
      } else {
        servers.push({
          name,
          description,
          transportType: "stdio",
          command: config.command as string,
          args: Array.isArray(config.args)
            ? (config.args as string[])
            : undefined,
          env:
            config.env && typeof config.env === "object"
              ? (config.env as Record<string, string>)
              : undefined,
        });
      }
    }

    if (servers.length === 0) {
      return {
        success: false,
        servers: [],
        error: "未找到有效的 MCP Server 配置",
      };
    }

    return { success: true, servers };
  } catch {
    return { success: false, servers: [], error: "JSON 解析失败，请检查格式" };
  }
}

/**
 * 将表单数据转换为 MCP JSON 字符串
 */
export function formDataToJson(data: ServerFormData): string {
  const serverConfig: Record<string, unknown> = {};

  if (data.description.trim()) {
    serverConfig.description = data.description.trim();
  }

  if (data.transportType === "sse") {
    serverConfig.type = "sse";
    serverConfig.url = data.url;
  } else {
    serverConfig.command = data.command;
    if (data.args.length > 0) {
      serverConfig.args = data.args;
    }
    const env: Record<string, string> = {};
    for (const pair of data.env) {
      if (pair.key.trim()) {
        env[pair.key.trim()] = pair.value;
      }
    }
    if (Object.keys(env).length > 0) {
      serverConfig.env = env;
    }
  }

  const name = data.name.trim() || "my-server";
  return JSON.stringify({ mcpServers: { [name]: serverConfig } }, null, 2);
}

/**
 * 将 JSON 字符串解析为表单数据
 */
export function jsonToFormData(jsonStr: string): ServerFormData | null {
  const result = parseMCPJson(jsonStr);
  if (!result.success || result.servers.length === 0) return null;

  const s = result.servers[0];
  return {
    name: s.name,
    description: s.description ?? "",
    transportType: s.transportType,
    command: s.command ?? "",
    args: s.args ?? [],
    env: s.env
      ? Object.entries(s.env).map(([key, value]) => ({ key, value }))
      : [],
    url: s.url ?? "",
  };
}
