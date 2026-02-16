import type { MCPTransportType } from "@/types/mcp";

/**
 * 推荐 MCP Server 配置模板
 */
export interface RecommendedMCPServer {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 图标路径（相对于 public 目录）或 null（使用首字母） */
  icon: string | null;
  /** 连接类型 */
  transportType: MCPTransportType;
  /** Stdio 配置 */
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  /** SSE 配置 */
  url?: string;
  /** 分类标签 */
  category: string;
  /** 是否需要用户填写参数 */
  requiresUserInput: boolean;
  /** 用户需要填写的字段说明 */
  userInputHints?: {
    field: string;
    placeholder: string;
    description?: string;
  }[];
}

/**
 * 内置推荐的 MCP Servers
 * 
 * 占位符约定：
 * - ${YOUR_XXX} 表示需要用户填写的参数
 * - 例如：${YOUR_API_KEY}、${YOUR_PROJECT_PATH} 等
 */
export const RECOMMENDED_MCP_SERVERS: RecommendedMCPServer[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "提供文件系统操作能力，可以读写本地文件和目录",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "${YOUR_PROJECT_PATH}"],
    category: "文件系统",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[2]",
        placeholder: "/path/to/your/project",
        description: "指定允许访问的项目目录路径",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    description: "集成 GitHub API，支持仓库管理、Issue、PR 等操作",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: "${YOUR_GITHUB_TOKEN}",
    },
    category: "开发工具",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.GITHUB_PERSONAL_ACCESS_TOKEN",
        placeholder: "ghp_xxxxxxxxxxxx",
        description: "在 GitHub Settings → Developer settings → Personal access tokens 创建",
      },
    ],
  },
  {
    id: "git",
    name: "Git",
    description: "提供 Git 仓库操作能力，支持提交、分支、历史查看等",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-git"],
    category: "开发工具",
    requiresUserInput: false,
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "连接 PostgreSQL 数据库，执行 SQL 查询和管理操作",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "${YOUR_DATABASE_URL}"],
    category: "数据库",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[2]",
        placeholder: "postgresql://user:password@localhost:5432/dbname",
        description: "PostgreSQL 数据库连接字符串",
      },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    description: "集成 Slack API，发送消息、管理频道等",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    env: {
      SLACK_BOT_TOKEN: "${YOUR_SLACK_BOT_TOKEN}",
      SLACK_TEAM_ID: "${YOUR_SLACK_TEAM_ID}",
    },
    category: "通讯协作",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.SLACK_BOT_TOKEN",
        placeholder: "xoxb-xxxxxxxxxxxx",
        description: "Slack Bot Token",
      },
      {
        field: "env.SLACK_TEAM_ID",
        placeholder: "T01234567",
        description: "Slack Team ID",
      },
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "访问 Google Drive 文件和文档",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gdrive"],
    category: "云存储",
    requiresUserInput: false,
  },
  {
    id: "puppeteer",
    name: "Puppeteer",
    description: "Web 自动化工具，支持浏览器控制和网页截图",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    category: "自动化",
    requiresUserInput: false,
  },
  {
    id: "brave-search",
    name: "Brave Search",
    description: "使用 Brave Search API 进行网络搜索",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: {
      BRAVE_API_KEY: "${YOUR_BRAVE_API_KEY}",
    },
    category: "搜索",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.BRAVE_API_KEY",
        placeholder: "BSA_xxxxxxxx",
        description: "在 Brave Search API 官网申请",
      },
    ],
  },
  {
    id: "memory",
    name: "Memory",
    description: "提供持久化记忆存储，Agent 可以记住重要信息",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    category: "工具",
    requiresUserInput: false,
  },
  {
    id: "fetch",
    name: "Fetch",
    description: "HTTP 请求工具，支持 GET、POST 等操作",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    category: "网络",
    requiresUserInput: false,
  },
];

/**
 * 获取所有分类
 */
export function getMCPCategories(): string[] {
  const categories = new Set(RECOMMENDED_MCP_SERVERS.map((s) => s.category));
  return Array.from(categories).sort();
}

/**
 * 根据分类获取推荐 Servers
 */
export function getMCPServersByCategory(category: string): RecommendedMCPServer[] {
  return RECOMMENDED_MCP_SERVERS.filter((s) => s.category === category);
}
