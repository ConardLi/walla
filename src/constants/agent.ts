export interface AgentDefinition {
  id: string;
  name: string;
  /** 本地 CLI 命令 [command, ...args] */
  cli: string[];
  /** npx 安装命令 [command, ...args]，undefined 表示不支持 npx 安装 */
  npx: string[] | undefined;
  /** 是否需要认证输入 */
  authInput?: boolean;
  auth?: boolean;
  /** 图标文件名（相对 /agent-img/） */
  icon: string;
  /** 文档链接 */
  doc: string;
  /** 认证方式 */
  authMethods?: any[];
  /** 是否支持自定义模型 */
  customModel?: boolean;
  /** 环境变量 */
  env?: Record<string, string>;
}

export const AGENTS: AgentDefinition[] = [
  {
    id: "opencode",
    name: "OpenCode",
    cli: ["opencode", "acp"],
    npx: ["npx", "-y opencode-ai acp"],
    auth: false,
    icon: "opencode.svg",
    doc: "https://opencode.ai/",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    cli: ["claude", "--experimental-acp"],
    npx: ["npx", "-y @zed-industries/claude-code-acp"],
    auth: true,
    icon: "claude.svg",
    doc: "https://code.claude.com/docs/en/overview",
  },
  {
    id: "openclaw-gateway",
    name: "OpenClaw",
    cli: ["openclaw", "gateway"],
    npx: undefined,
    auth: false,
    icon: "openclaw.svg",
    doc: "https://docs.openclaw.ai/cli/gateway",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    cli: ["gemini", "--experimental-acp"],
    npx: ["npx", "-y @google/gemini-cli"],
    auth: true,
    icon: "gemini.svg",
    doc: "https://geminicli.com/",
  },
  {
    id: "gitHub-copilot",
    name: "GitHub Copilot",
    cli: ["copilot", "--acp --stdio"],
    npx: ["npx", "-y @github/copilot --acp --stdio"],
    auth: false,
    icon: "copilot.svg",
    doc: "https://github.com/features/copilot",
  },
  {
    id: "iflow-cli",
    name: "iFlow CLI",
    cli: ["iflow", "--experimental-acp"],
    npx: ["npx", "-y @iflow-ai/iflow-cli --experimental-acp"],
    auth: true,
    icon: "iflow.svg",
    doc: "https://cli.iflow.cn/",
    customModel: true,
    env: {
      apiKey: "IFLOW_API_KEY",
      baseUrl: "IFLOW_BASE_URL",
      model: "IFLOW_MODEL_NAME",
    },
  },
  {
    id: "codex",
    name: "Codex",
    cli: ["codex"],
    npx: ["npx", "-y @zed-industries/codex-acp"],
    auth: false,
    icon: "codex.png",
    doc: "https://developers.openai.com/codex/cli/",
  },
  {
    id: "goose",
    name: "Goose",
    cli: ["goose", "acp"],
    npx: undefined,
    auth: false,
    icon: "goose.png",
    doc: "https://block.github.io/goose/docs/getting-started/installation/",
  },
  {
    id: "augment-code",
    name: "Augment Code",
    cli: ["auggie", "--acp"],
    npx: ["npx", "-y @augmentcode/auggie --acp"],
    authInput: true,
    icon: "augment_code.svg",
    doc: "https://docs.augmentcode.com/quickstart",
    authMethods: [
      {
        id: "augment-code-login",
        name: "Log in with Augment Code CLI",
        description: "Run Augment Code Login in the terminal",
        _meta: {
          "terminal-auth": {
            command: "npx",
            args: ["-y", "@augmentcode/auggie", "login"],
            label: "Augment Code Login",
          },
        },
      },
    ],
  },
  {
    id: "kimi-cli",
    name: "Kimi CLI",
    cli: ["kimi", "acp"],
    npx: undefined,
    auth: false,
    icon: "kimi.svg",
    doc: "https://moonshotai.github.io/kimi-cli/en/guides/getting-started.html",
  },
  {
    id: "qoder",
    name: "Qoder CLI",
    cli: ["qodercli", "--acp"],
    npx: ["npx", "-y @qoder-ai/qodercli --acp"],
    auth: false,
    icon: "qoder.svg",
    doc: "https://qoder.com/cli",
  },
];
