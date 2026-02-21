import type { ModelProvider, ProviderType } from "@/types/model";

export interface BuiltinProviderTemplate {
  id: string;
  name: string;
  type: ProviderType;
  apiHost: string;
  icon?: string;
  models: Array<{
    id: string;
    name: string;
    group?: string;
  }>;
}

export const BUILTIN_PROVIDER_TEMPLATES: BuiltinProviderTemplate[] = [
  {
    id: "openai",
    name: "OpenAI",
    type: "openai",
    apiHost: "https://api.openai.com/v1",
    icon: "/providers/openai.svg",
    models: [
      { id: "gpt-4o", name: "GPT-4o", group: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", group: "GPT-4o" },
      { id: "gpt-4.1", name: "GPT-4.1", group: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", group: "GPT-4.1" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", group: "GPT-4.1" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", group: "GPT-4" },
      { id: "gpt-4", name: "GPT-4", group: "GPT-4" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", group: "GPT-3.5" },
      { id: "gpt-5", name: "GPT-5", group: "GPT-5" },
      { id: "gpt-5-mini", name: "GPT-5 Mini", group: "GPT-5" },
      { id: "gpt-5-nano", name: "GPT-5 Nano", group: "GPT-5" },
      { id: "gpt-5-pro", name: "GPT-5 Pro", group: "GPT-5" },
      { id: "gpt-5-codex", name: "GPT-5 Codex", group: "GPT-5" },
      { id: "gpt-5.1", name: "GPT-5.1", group: "GPT-5.1" },
      { id: "gpt-5.2", name: "GPT-5.2", group: "GPT-5.2" },
      { id: "o1", name: "o1", group: "o1" },
      { id: "o1-mini", name: "o1 Mini", group: "o1" },
      { id: "o1-pro", name: "o1 Pro", group: "o1" },
      { id: "o3", name: "o3", group: "o3" },
      { id: "o3-mini", name: "o3 Mini", group: "o3" },
      { id: "o3-pro", name: "o3 Pro", group: "o3" },
      { id: "o4-mini", name: "o4 Mini", group: "o4" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    type: "anthropic",
    apiHost: "https://api.anthropic.com",
    icon: "/providers/anthropic.svg",
    models: [
      {
        id: "claude-opus-4-5-20250915",
        name: "Claude Opus 4.5",
        group: "Claude 4.5",
      },
      {
        id: "claude-sonnet-4-5-20250929",
        name: "Claude Sonnet 4.5",
        group: "Claude 4.5",
      },
      {
        id: "claude-haiku-4-5-20251015",
        name: "Claude Haiku 4.5",
        group: "Claude 4.5",
      },
      {
        id: "claude-opus-4-1-20250805",
        name: "Claude Opus 4.1",
        group: "Claude 4.1",
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        group: "Claude 4",
      },
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        group: "Claude 4",
      },
      {
        id: "claude-3-7-sonnet-20250224",
        name: "Claude 3.7 Sonnet",
        group: "Claude 3.7",
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        group: "Claude 3.5",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        group: "Claude 3.5",
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        group: "Claude 3",
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        group: "Claude 3",
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    type: "gemini",
    apiHost: "https://generativelanguage.googleapis.com/v1beta",
    icon: "/providers/gemini.svg",
    models: [
      { id: "gemini-3-pro", name: "Gemini 3 Pro", group: "Gemini 3" },
      {
        id: "gemini-2.5-pro-preview-06-05",
        name: "Gemini 2.5 Pro",
        group: "Gemini 2.5",
      },
      {
        id: "gemini-2.5-flash-preview-05-20",
        name: "Gemini 2.5 Flash",
        group: "Gemini 2.5",
      },
      {
        id: "gemini-2.5-flash-lite-preview-06-17",
        name: "Gemini 2.5 Flash-Lite",
        group: "Gemini 2.5",
      },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", group: "Gemini 2.0" },
      {
        id: "gemini-2.0-flash-lite",
        name: "Gemini 2.0 Flash-Lite",
        group: "Gemini 2.0",
      },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", group: "Gemini 1.5" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", group: "Gemini 1.5" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    type: "openai-compatible",
    apiHost: "https://api.deepseek.com/v1",
    icon: "/providers/deepseek.png",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", group: "DeepSeek" },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner", group: "DeepSeek" },
      { id: "deepseek-r1", name: "DeepSeek R1", group: "DeepSeek R1" },
      { id: "deepseek-v3", name: "DeepSeek V3", group: "DeepSeek V3" },
      { id: "deepseek-v3.1", name: "DeepSeek V3.1", group: "DeepSeek V3" },
    ],
  },
  {
    id: "moonshot",
    name: "Moonshot",
    type: "openai-compatible",
    apiHost: "https://api.moonshot.cn/v1",
    icon: "/providers/kimi.svg",
    models: [
      { id: "moonshot-v1-auto", name: "Moonshot v1 Auto", group: "Moonshot" },
      { id: "moonshot-v1-8k", name: "Moonshot v1 8K", group: "Moonshot" },
      { id: "moonshot-v1-32k", name: "Moonshot v1 32K", group: "Moonshot" },
      { id: "moonshot-v1-128k", name: "Moonshot v1 128K", group: "Moonshot" },
      { id: "kimi-k2-0711-preview", name: "Kimi K2", group: "Kimi K2" },
      { id: "kimi-k2-0905-preview", name: "Kimi K2 0905", group: "Kimi K2" },
      { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", group: "Kimi K2" },
    ],
  },
  {
    id: "zhipu",
    name: "智谱 AI",
    type: "openai-compatible",
    apiHost: "https://open.bigmodel.cn/api/paas/v4",
    icon: "/providers/zhipu.png",
    models: [
      { id: "glm-4.6", name: "GLM-4.6", group: "GLM-4.6" },
      { id: "glm-4.5", name: "GLM-4.5", group: "GLM-4.5" },
      { id: "glm-4.5-air", name: "GLM-4.5 Air", group: "GLM-4.5" },
      { id: "glm-4-plus", name: "GLM-4 Plus", group: "GLM-4" },
      { id: "glm-4-flash", name: "GLM-4 Flash", group: "GLM-4" },
      { id: "glm-4-long", name: "GLM-4 Long", group: "GLM-4" },
      { id: "glm-4-air", name: "GLM-4 Air", group: "GLM-4" },
      { id: "glm-4-airx", name: "GLM-4 AirX", group: "GLM-4" },
      { id: "glm-4v-plus", name: "GLM-4V Plus", group: "GLM-4V" },
      { id: "glm-z1-32b-0414", name: "GLM-Z1 32B", group: "GLM-Z1" },
    ],
  },
  {
    id: "dashscope",
    name: "阿里云百炼",
    type: "openai-compatible",
    apiHost: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    icon: "/providers/bailian.png",
    models: [
      { id: "qwen3-max", name: "Qwen3 Max", group: "Qwen3" },
      { id: "qwen-plus", name: "Qwen Plus", group: "Qwen3" },
      { id: "qwen-flash", name: "Qwen Flash", group: "Qwen3" },
      { id: "qwen-max", name: "Qwen Max", group: "Qwen" },
      { id: "qwen-turbo", name: "Qwen Turbo", group: "Qwen" },
      { id: "qwen-long", name: "Qwen Long", group: "Qwen" },
      { id: "qwq-plus", name: "QwQ Plus", group: "QwQ" },
      { id: "qvq-max", name: "QVQ Max", group: "QVQ" },
      { id: "qwen3-vl-plus", name: "Qwen3 VL Plus", group: "Qwen3-VL" },
      { id: "qwen3-vl-flash", name: "Qwen3 VL Flash", group: "Qwen3-VL" },
    ],
  },
  {
    id: "doubao",
    name: "火山引擎",
    type: "openai-compatible",
    apiHost: "https://ark.cn-beijing.volces.com/api/v3",
    icon: "/providers/doubao.png",
    models: [
      { id: "doubao-seed-1.6", name: "Doubao Seed 1.6", group: "Doubao Seed" },
      {
        id: "doubao-seed-1.6-flash",
        name: "Doubao Seed 1.6 Flash",
        group: "Doubao Seed",
      },
      {
        id: "doubao-seed-1.6-thinking",
        name: "Doubao Seed 1.6 Thinking",
        group: "Doubao Seed",
      },
      {
        id: "doubao-seed-code",
        name: "Doubao Seed Code",
        group: "Doubao Seed",
      },
      {
        id: "doubao-1.5-pro-256k",
        name: "Doubao 1.5 Pro 256K",
        group: "Doubao 1.5",
      },
      {
        id: "doubao-1.5-pro-32k",
        name: "Doubao 1.5 Pro 32K",
        group: "Doubao 1.5",
      },
      {
        id: "doubao-1.5-thinking-pro",
        name: "Doubao 1.5 Thinking Pro",
        group: "Doubao 1.5",
      },
      {
        id: "doubao-1.5-vision-pro",
        name: "Doubao 1.5 Vision Pro",
        group: "Doubao 1.5",
      },
      {
        id: "doubao-1.5-thinking-vision-pro",
        name: "Doubao 1.5 Thinking Vision Pro",
        group: "Doubao 1.5",
      },
    ],
  },
  {
    id: "xai",
    name: "xAI",
    type: "openai-compatible",
    apiHost: "https://api.x.ai/v1",
    icon: "/providers/grok.png",
    models: [
      { id: "grok-4", name: "Grok 4", group: "Grok 4" },
      {
        id: "grok-4-fast-reasoning",
        name: "Grok 4 Fast Reasoning",
        group: "Grok 4",
      },
      { id: "grok-4.1", name: "Grok 4.1", group: "Grok 4.1" },
      {
        id: "grok-4.1-fast-reasoning",
        name: "Grok 4.1 Fast Reasoning",
        group: "Grok 4.1",
      },
      { id: "grok-3", name: "Grok 3", group: "Grok 3" },
      { id: "grok-2-vision-1212", name: "Grok 2 Vision", group: "Grok 2" },
      { id: "grok-code-fast-1", name: "Grok Code Fast 1", group: "Grok Code" },
    ],
  },
  {
    id: "meta",
    name: "Meta Llama",
    type: "openai-compatible",
    apiHost: "https://api.meta.ai/v1",
    models: [
      { id: "llama-4-maverick", name: "Llama 4 Maverick", group: "Llama 4" },
      { id: "llama-4-scout", name: "Llama 4 Scout", group: "Llama 4" },
      {
        id: "llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        group: "Llama 3.3",
      },
      { id: "llama-3.2-90b-vision", name: "Llama 3.2 90B", group: "Llama 3.2" },
      { id: "llama-3.2-11b-vision", name: "Llama 3.2 11B", group: "Llama 3.2" },
      { id: "llama-3.1-405b", name: "Llama 3.1 405B", group: "Llama 3.1" },
      { id: "llama-3.1-70b", name: "Llama 3.1 70B", group: "Llama 3.1" },
    ],
  },
  {
    id: "minimax",
    name: "MiniMax",
    type: "openai-compatible",
    apiHost: "https://api.minimax.chat/v1",
    icon: "/providers/minimax.png",
    models: [
      { id: "abab6.5s", name: "abab 6.5s", group: "abab" },
      { id: "abab6.5g", name: "abab 6.5g", group: "abab" },
      { id: "abab6.5t", name: "abab 6.5t", group: "abab" },
      { id: "minimax-m2", name: "MiniMax M2", group: "MiniMax M2" },
    ],
  },
  {
    id: "baidu",
    name: "百度文心",
    type: "openai-compatible",
    apiHost: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop",
    models: [
      {
        id: "ernie-5.0-thinking-preview",
        name: "ERNIE 5.0 Thinking",
        group: "ERNIE 5.0",
      },
      {
        id: "ernie-4.5-turbo-128k",
        name: "ERNIE 4.5 Turbo 128K",
        group: "ERNIE 4.5",
      },
      {
        id: "ernie-4.5-turbo-vl-32k",
        name: "ERNIE 4.5 Turbo VL",
        group: "ERNIE 4.5",
      },
      {
        id: "ernie-x1-turbo-32k",
        name: "ERNIE X1 Turbo 32K",
        group: "ERNIE X1",
      },
      {
        id: "ernie-4.0-turbo-8k",
        name: "ERNIE 4.0 Turbo 8K",
        group: "ERNIE 4.0",
      },
      {
        id: "ernie-4.0-turbo-128k",
        name: "ERNIE 4.0 Turbo 128K",
        group: "ERNIE 4.0",
      },
      { id: "ernie-4.0-8k", name: "ERNIE 4.0 8K", group: "ERNIE 4.0" },
    ],
  },
  {
    id: "tencent",
    name: "腾讯混元",
    type: "openai-compatible",
    apiHost: "https://api.hunyuan.cloud.tencent.com/v1",
    models: [
      { id: "hunyuan-t1", name: "混元 T1", group: "混元 T1" },
      { id: "hunyuan-t1-vision", name: "混元 T1 Vision", group: "混元 T1" },
      { id: "hunyuan-turbos", name: "混元 TurboS", group: "混元 TurboS" },
      {
        id: "hunyuan-turbos-longtext-128k",
        name: "混元 TurboS 128K",
        group: "混元 TurboS",
      },
      {
        id: "hunyuan-turbos-vision",
        name: "混元 TurboS Vision",
        group: "混元 TurboS",
      },
      { id: "hunyuan-standard", name: "混元 Standard", group: "混元 Standard" },
      { id: "hunyuan-lite", name: "混元 Lite", group: "混元 Lite" },
      { id: "hunyuan-vision", name: "混元 Vision", group: "混元 Vision" },
      { id: "hunyuan-code", name: "混元 Code", group: "混元 Code" },
      { id: "hunyuan-a13b", name: "混元 A13B", group: "混元 A13B" },
      {
        id: "hunyuan-a13b-thinking",
        name: "混元 A13B Thinking",
        group: "混元 A13B",
      },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    type: "ollama",
    apiHost: "http://localhost:11434",
    icon: "/providers/ollama.png",
    models: [],
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    type: "azure-openai",
    apiHost: "",
    models: [],
  },
  {
    id: "groq",
    name: "Groq",
    type: "openai-compatible",
    apiHost: "https://api.groq.com/openai/v1",
    icon: "/providers/groq.png",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", group: "Llama" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", group: "Llama" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", group: "Mixtral" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", group: "Gemma" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    type: "openai-compatible",
    apiHost: "https://openrouter.ai/api/v1",
    models: [],
  },
  {
    id: "silicon",
    name: "硅基流动",
    type: "openai-compatible",
    apiHost: "https://api.siliconflow.cn/v1",
    models: [
      { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3", group: "DeepSeek" },
      { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", group: "DeepSeek" },
      { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B", group: "Qwen" },
      {
        id: "Qwen/Qwen3-235B-A22B-Instruct-2507",
        name: "Qwen3 235B",
        group: "Qwen3",
      },
      {
        id: "Qwen/Qwen3-30B-A3B-Instruct-2507",
        name: "Qwen3 30B",
        group: "Qwen3",
      },
    ],
  },
];

export function createProviderFromTemplate(
  template: BuiltinProviderTemplate,
): ModelProvider {
  return {
    id: template.id,
    name: template.name,
    type: template.type,
    apiKey: "",
    apiHost: template.apiHost,
    icon: template.icon,
    models: template.models.map((m) => ({
      id: m.id,
      name: m.name,
      providerId: template.id,
      group: m.group,
      enabled: true,
    })),
    enabled: false,
    isSystem: true,
  };
}
