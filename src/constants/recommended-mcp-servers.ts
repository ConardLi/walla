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
  // 开发工具
  {
    id: "github",
    name: "GitHub",
    description: "集成 GitHub API，支持仓库管理、Issue、PR 等操作",
    icon: "/mcp/github.svg",
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
        description:
          "在 GitHub Settings → Developer settings → Personal access tokens 创建",
      },
    ],
  },
  // {
  //   id: "git",
  //   name: "Git",
  //   description: "提供 Git 仓库操作能力，支持提交、分支、历史查看等",
  //   icon: "/mcp/git.svg",
  //   transportType: "stdio",
  //   command: "npx",
  //   args: ["-y", "@modelcontextprotocol/server-git"],
  //   category: "开发工具",
  //   requiresUserInput: false,
  // },
  {
    id: "gitlab",
    name: "GitLab",
    description: "集成 GitLab API，支持项目管理、文件操作等",
    icon: "/mcp/gitlab.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gitlab"],
    env: {
      GITLAB_PERSONAL_ACCESS_TOKEN: "${YOUR_GITLAB_TOKEN}",
    },
    category: "开发工具",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.GITLAB_PERSONAL_ACCESS_TOKEN",
        placeholder: "glpat-xxxxxxxxxxxx",
        description: "GitLab Personal Access Token",
      },
    ],
  },
  {
    id: "jetbrains",
    name: "JetBrains",
    description: "连接 JetBrains IDE，实现与 IDE 的交互",
    icon: "/mcp/jetbrains.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@jetbrains/mcp-proxy"],
    category: "开发工具",
    requiresUserInput: false,
  },

  // 搜索引擎
  {
    id: "brave-search",
    name: "Brave Search",
    description: "使用 Brave Search API 进行网络搜索",
    icon: "/mcp/brave.svg",
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
    id: "perplexity",
    name: "Perplexity",
    description: "集成 Perplexity Sonar API，提供实时网络研究能力",
    icon: "/mcp/perplexity.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "server-perplexity-ask"],
    env: {
      PERPLEXITY_API_KEY: "${YOUR_PERPLEXITY_API_KEY}",
    },
    category: "搜索",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.PERPLEXITY_API_KEY",
        placeholder: "pplx-xxxxxxxxxxxx",
        description: "Perplexity API Key",
      },
    ],
  },
  {
    id: "exa",
    name: "Exa",
    description: "使用 Exa AI Search API 进行智能网络搜索",
    icon: "/mcp/exa.png",
    transportType: "stdio",
    command: "npx",
    args: ["exa-mcp-server"],
    env: {
      EXA_API_KEY: "${YOUR_EXA_API_KEY}",
    },
    category: "搜索",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.EXA_API_KEY",
        placeholder: "exa_xxxxxxxxxxxx",
        description: "Exa API Key",
      },
    ],
  },
  {
    id: "tavily",
    name: "Tavily",
    description: "使用 Tavily API 进行网络搜索和信息检索",
    icon: "/mcp/tavily.jpeg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "tavily-mcp"],
    env: {
      TAVILY_API_KEY: "${YOUR_TAVILY_API_KEY}",
    },
    category: "搜索",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.TAVILY_API_KEY",
        placeholder: "tvly-xxxxxxxxxxxx",
        description: "Tavily API Key",
      },
    ],
  },

  // 云存储
  {
    id: "google-drive",
    name: "Google Drive",
    description: "访问 Google Drive 文件和文档，支持列表、读取和搜索",
    icon: "/mcp/drive.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gdrive"],
    env: {
      GDRIVE_CREDENTIALS_PATH: "${YOUR_CREDENTIALS_PATH}",
    },
    category: "云存储",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.GDRIVE_CREDENTIALS_PATH",
        placeholder: "/path/to/.gdrive-credentials.json",
        description: "Google Drive 凭证文件路径",
      },
    ],
  },

  // 数据库
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "连接 PostgreSQL 数据库，执行 SQL 查询和管理操作",
    icon: "/mcp/postgresql.svg",
    transportType: "stdio",
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-postgres",
      "${YOUR_DATABASE_URL}",
    ],
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
    id: "bigquery",
    name: "BigQuery",
    description: "连接 Google BigQuery，支持数据库模式检查和查询执行",
    icon: "/mcp/bigquery.svg",
    transportType: "stdio",
    command: "uvx",
    args: [
      "mcp-server-bigquery",
      "--project",
      "${YOUR_PROJECT_ID}",
      "--location",
      "${YOUR_LOCATION}",
    ],
    category: "数据库",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[2]",
        placeholder: "your-project-id",
        description: "Google Cloud 项目 ID",
      },
      {
        field: "args[4]",
        placeholder: "US",
        description: "数据集位置",
      },
    ],
  },

  // 通讯协作
  {
    id: "slack",
    name: "Slack",
    description: "集成 Slack API，发送消息、管理频道等",
    icon: "/mcp/slack.svg",
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
    id: "discord",
    name: "Discord",
    description: "集成 Discord API，管理频道、发送消息、获取服务器信息",
    icon: "/mcp/discord.svg",
    transportType: "sse",
    url: "https://gitmcp.io/SaseQ/discord-mcp",
    category: "通讯协作",
    requiresUserInput: false,
  },

  // 自动化
  {
    id: "puppeteer",
    name: "Puppeteer",
    description: "Web 自动化工具，支持浏览器控制和网页截图",
    icon: "/mcp/chrome.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    category: "自动化",
    requiresUserInput: false,
  },
  {
    id: "playwright",
    name: "Playwright",
    description: "浏览器自动化工具，通过可访问性快照与网页交互",
    icon: "/mcp/playwright.svg",
    transportType: "stdio",
    command: "npx",
    args: ["@playwright/mcp@latest"],
    category: "自动化",
    requiresUserInput: false,
  },
  {
    id: "applescript",
    name: "AppleScript",
    description: "在 macOS 上运行 AppleScript 代码，与系统应用交互",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["@peakmojo/applescript-mcp"],
    category: "自动化",
    requiresUserInput: false,
  },

  // 代码执行
  {
    id: "e2b",
    name: "E2B Code Interpreter",
    description: "在安全沙箱中运行代码",
    icon: "/mcp/e2b.png",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@e2b/mcp-server"],
    env: {
      E2B_API_KEY: "${YOUR_E2B_API_KEY}",
    },
    category: "代码执行",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.E2B_API_KEY",
        placeholder: "e2b_xxxxxxxxxxxx",
        description: "E2B API Key",
      },
    ],
  },
  {
    id: "pydantic-run-python",
    name: "Pydantic Run Python",
    description: "在安全沙箱环境中执行 Python 代码",
    icon: "/mcp/python.svg",
    transportType: "stdio",
    command: "deno",
    args: [
      "run",
      "-N",
      "-R=node_modules",
      "-W=node_modules",
      "--node-modules-dir=auto",
      "jsr:@pydantic/mcp-run-python",
      "stdio",
    ],
    category: "代码执行",
    requiresUserInput: false,
  },

  // 平台集成
  {
    id: "stripe",
    name: "Stripe",
    description: "集成 Stripe API，管理支付、订阅等",
    icon: "/mcp/stripe.svg",
    transportType: "stdio",
    command: "npx",
    args: [
      "-y",
      "@stripe/mcp",
      "--tools=all",
      "--api-key=${YOUR_STRIPE_SECRET_KEY}",
    ],
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[2]",
        placeholder: "--api-key=sk_test_xxxxxxxxxxxx",
        description: "Stripe Secret Key",
      },
    ],
  },
  {
    id: "square",
    name: "Square",
    description: "集成 Square Connect API，管理支付和商户信息",
    icon: null,
    transportType: "sse",
    url: "https://mcp.squareup.com/sse",
    category: "平台集成",
    requiresUserInput: false,
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "集成 Supabase API，管理数据库、存储和认证",
    icon: "/mcp/supabase.svg",
    transportType: "stdio",
    command: "npx",
    args: [
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--access-token",
      "${YOUR_ACCESS_TOKEN}",
    ],
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[2]",
        placeholder: "sbp_xxxxxxxxxxxx",
        description: "Supabase Personal Access Token",
      },
    ],
  },
  {
    id: "firebase",
    name: "Firebase",
    description: "直接与 Firebase 服务交互",
    icon: "/mcp/firebase.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@gannonh/firebase-mcp"],
    env: {
      SERVICE_ACCOUNT_KEY_PATH: "${YOUR_SERVICE_ACCOUNT_PATH}",
      FIREBASE_STORAGE_BUCKET: "${YOUR_STORAGE_BUCKET}",
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.SERVICE_ACCOUNT_KEY_PATH",
        placeholder: "/path/to/serviceAccountKey.json",
        description: "Firebase 服务账号密钥路径",
      },
      {
        field: "env.FIREBASE_STORAGE_BUCKET",
        placeholder: "your-project.firebasestorage.app",
        description: "Firebase Storage Bucket",
      },
    ],
  },
  {
    id: "heroku",
    name: "Heroku",
    description: "管理 Heroku Platform 资源",
    icon: "/mcp/heroku.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@heroku/mcp-server"],
    env: {
      HEROKU_API_KEY: "${YOUR_HEROKU_API_KEY}",
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.HEROKU_API_KEY",
        placeholder: "your-heroku-api-key",
        description: "Heroku API Key",
      },
    ],
  },
  {
    id: "paddle",
    name: "Paddle",
    description: "集成 Paddle Billing API",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: [
      "-y",
      "@paddle/paddle-mcp",
      "--api-key=${YOUR_PADDLE_API_KEY}",
      "--environment=sandbox",
    ],
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[1]",
        placeholder: "--api-key=your_api_key",
        description: "Paddle API Key",
      },
    ],
  },
  {
    id: "xero",
    name: "Xero",
    description: "集成 Xero API，访问会计和业务功能",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@xeroapi/xero-mcp-server@latest"],
    env: {
      XERO_CLIENT_ID: "${YOUR_XERO_CLIENT_ID}",
      XERO_CLIENT_SECRET: "${YOUR_XERO_CLIENT_SECRET}",
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.XERO_CLIENT_ID",
        placeholder: "your-client-id",
        description: "Xero Client ID",
      },
      {
        field: "env.XERO_CLIENT_SECRET",
        placeholder: "your-client-secret",
        description: "Xero Client Secret",
      },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    description: "集成 Notion API，管理页面和数据库",
    icon: "/mcp/notion.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@notionhq/notion-mcp-server"],
    env: {
      OPENAPI_MCP_HEADERS:
        '{"Authorization": "Bearer ${YOUR_NOTION_TOKEN}", "Notion-Version": "2022-06-28"}',
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.OPENAPI_MCP_HEADERS",
        placeholder: '{"Authorization": "Bearer ntn_****"}',
        description: "Notion Integration Token",
      },
    ],
  },
  {
    id: "clickup",
    name: "ClickUp",
    description: "集成 ClickUp API，管理任务、空间和列表",
    icon: "/mcp/clickup.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@taazkareem/clickup-mcp-server@latest"],
    env: {
      CLICKUP_API_KEY: "${YOUR_CLICKUP_API_KEY}",
      CLICKUP_TEAM_ID: "${YOUR_CLICKUP_TEAM_ID}",
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.CLICKUP_API_KEY",
        placeholder: "pk_xxxxxxxxxxxx",
        description: "ClickUp API Key",
      },
      {
        field: "env.CLICKUP_TEAM_ID",
        placeholder: "your-team-id",
        description: "ClickUp Team ID",
      },
    ],
  },
  {
    id: "monday",
    name: "Monday",
    description: "集成 Monday.com API，管理看板和项目",
    icon: "/mcp/monday.svg",
    transportType: "stdio",
    command: "uvx",
    args: ["mcp-server-monday"],
    env: {
      MONDAY_API_KEY: "${YOUR_MONDAY_API_KEY}",
      MONDAY_WORKSPACE_NAME: "${YOUR_WORKSPACE_NAME}",
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.MONDAY_API_KEY",
        placeholder: "your-monday-api-key",
        description: "Monday.com API Key",
      },
      {
        field: "env.MONDAY_WORKSPACE_NAME",
        placeholder: "your-workspace-name",
        description: "Monday.com Workspace Name",
      },
    ],
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "读写 Airtable 数据库，检查模式和操作记录",
    icon: "/mcp/airtable.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "airtable-mcp-server"],
    env: {
      AIRTABLE_API_KEY: "${YOUR_AIRTABLE_API_KEY}",
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.AIRTABLE_API_KEY",
        placeholder: "pat*.xxxxxxxxxxxx",
        description: "Airtable API Key",
      },
    ],
  },
  {
    id: "ghost",
    name: "Ghost",
    description: "集成 Ghost CMS API，管理博客内容",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@fanyangmeng/ghost-mcp"],
    env: {
      GHOST_API_URL: "${YOUR_GHOST_URL}",
      GHOST_ADMIN_API_KEY: "${YOUR_GHOST_API_KEY}",
    },
    category: "平台集成",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.GHOST_API_URL",
        placeholder: "https://yourblog.com",
        description: "Ghost 博客 URL",
      },
      {
        field: "env.GHOST_ADMIN_API_KEY",
        placeholder: "your-admin-api-key",
        description: "Ghost Admin API Key",
      },
    ],
  },

  // AI/ML
  {
    id: "context7",
    name: "Context7",
    description: "获取最新的版本特定文档和代码示例",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@upstash/context7-mcp@latest"],
    category: "记忆",
    requiresUserInput: false,
  },
  {
    id: "chroma",
    name: "Chroma",
    description: "向量数据库，支持向量搜索、全文搜索和元数据过滤",
    icon: null,
    transportType: "stdio",
    command: "uvx",
    args: [
      "chroma-mcp",
      "--client-type",
      "cloud",
      "--tenant",
      "${YOUR_TENANT_ID}",
      "--database",
      "${YOUR_DATABASE}",
      "--api-key",
      "${YOUR_API_KEY}",
    ],
    category: "向量数据库",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[4]",
        placeholder: "your-tenant-id",
        description: "Chroma Tenant ID",
      },
      {
        field: "args[6]",
        placeholder: "your-database-name",
        description: "Chroma Database Name",
      },
      {
        field: "args[8]",
        placeholder: "your-api-key",
        description: "Chroma API Key",
      },
    ],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "文本转语音和音频处理 API",
    icon: null,
    transportType: "stdio",
    command: "uvx",
    args: ["elevenlabs-mcp"],
    env: {
      ELEVENLABS_API_KEY: "${YOUR_ELEVENLABS_API_KEY}",
    },
    category: "语音处理",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.ELEVENLABS_API_KEY",
        placeholder: "your-api-key",
        description: "ElevenLabs API Key",
      },
    ],
  },

  // 监控/日志
  {
    id: "sentry",
    name: "Sentry",
    description: "集成 Sentry API，访问错误监控数据",
    icon: "/mcp/sentry.svg",
    transportType: "sse",
    url: "https://mcp.sentry.dev/sse",
    category: "监控/日志",
    requiresUserInput: false,
  },
  {
    id: "pydantic-logfire",
    name: "Pydantic Logfire",
    description: "访问 Logfire 中的 OpenTelemetry 追踪和指标",
    icon: null,
    transportType: "stdio",
    command: "uvx",
    args: ["logfire-mcp", "--read-token=${YOUR_LOGFIRE_TOKEN}"],
    category: "监控/日志",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "args[1]",
        placeholder: "--read-token=your-token",
        description: "Logfire Read Token",
      },
    ],
  },
  {
    id: "lightdash",
    name: "Lightdash",
    description: "访问 Lightdash 数据分析 API",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "lightdash-mcp-server"],
    env: {
      LIGHTDASH_API_KEY: "${YOUR_LIGHTDASH_API_KEY}",
      LIGHTDASH_API_URL: "${YOUR_LIGHTDASH_URL}",
    },
    category: "监控/日志",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.LIGHTDASH_API_KEY",
        placeholder: "your-api-key",
        description: "Lightdash API Key",
      },
      {
        field: "env.LIGHTDASH_API_URL",
        placeholder: "https://your-instance.lightdash.cloud",
        description: "Lightdash API URL",
      },
    ],
  },

  // 工具
  {
    id: "memory",
    name: "Memory",
    description: "提供持久化记忆存储，Agent 可以记住重要信息",
    icon: null,
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    category: "记忆",
    requiresUserInput: false,
  },
  {
    id: "basic-memory",
    name: "Basic Memory",
    description: "通过 Markdown 文件构建持久化知识库",
    icon: null,
    transportType: "stdio",
    command: "uvx",
    args: ["basic-memory", "mcp"],
    category: "记忆",
    requiresUserInput: false,
  },
  {
    id: "iterm",
    name: "iTerm",
    description: "访问和操作 iTerm 终端会话",
    icon: "/mcp/iterm2.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "iterm-mcp"],
    category: "终端",
    requiresUserInput: false,
  },

  // 网络
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
  {
    id: "firecrawl",
    name: "Firecrawl",
    description: "网页抓取工具，提供强大的爬虫能力",
    icon: "/mcp/firecrawl.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "firecrawl-mcp"],
    env: {
      FIRECRAWL_API_KEY: "${YOUR_FIRECRAWL_API_KEY}",
    },
    category: "网络",
    requiresUserInput: true,
    userInputHints: [
      {
        field: "env.FIRECRAWL_API_KEY",
        placeholder: "fc-xxxxxxxxxxxx",
        description: "Firecrawl API Key",
      },
    ],
  },

  // 其他
  {
    id: "talk-to-figma",
    name: "Talk to Figma",
    description: "与 Figma 通信，读取和修改设计",
    icon: "mcp/figma.svg",
    transportType: "stdio",
    command: "bunx",
    args: ["cursor-talk-to-figma-mcp@latest"],
    category: "设计",
    requiresUserInput: false,
  },
  {
    id: "airbnb",
    name: "Airbnb",
    description: "搜索 Airbnb 房源并获取详情",
    icon: "mcp/airbnb.svg",
    transportType: "stdio",
    command: "npx",
    args: ["-y", "@openbnb/mcp-server-airbnb", "--ignore-robots-txt"],
    category: "旅行",
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
export function getMCPServersByCategory(
  category: string,
): RecommendedMCPServer[] {
  return RECOMMENDED_MCP_SERVERS.filter((s) => s.category === category);
}
