# AI SDK 多提供商测试脚本

这个目录包含了针对各个主流 AI 模型提供商的测试脚本，基于 [Vercel AI SDK](https://ai-sdk.dev/) 实现。

## 支持的提供商

| 提供商 | 包名 | 测试脚本 | 状态 |
|--------|------|----------|------|
| OpenAI | `@ai-sdk/openai` | `test-openai.ts` | ✅ |
| Anthropic (Claude) | `@ai-sdk/anthropic` | `test-anthropic.ts` | ✅ |
| Google Gemini | `@ai-sdk/google` | `test-gemini.ts` | ✅ |
| Azure OpenAI | `@ai-sdk/azure` | `test-azure-openai.ts` | ✅ |
| Ollama | `ollama-ai-provider-v2` | `test-ollama.ts` | ✅ |
| OpenAI 兼容 | `@ai-sdk/openai` | `test-openai-compatible.ts` | ✅ |

## 快速开始

### 1. 安装依赖

```bash
cd test/ai-sdk
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填入你的 API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你要测试的提供商的凭证：

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=...

# Azure OpenAI
AZURE_RESOURCE_NAME=your-resource-name
AZURE_API_KEY=...
AZURE_DEPLOYMENT_NAME=your-deployment-name

# Ollama (本地运行，通常不需要 API Key)
OLLAMA_BASE_URL=http://localhost:11434/api

# OpenAI 兼容接口（如硅基流动、DeepSeek 等）
OPENAI_COMPATIBLE_BASE_URL=https://api.siliconflow.cn/v1
OPENAI_COMPATIBLE_API_KEY=sk-...
OPENAI_COMPATIBLE_MODEL=deepseek-chat
```

### 3. 运行测试

#### 测试单个提供商

```bash
# 测试 OpenAI
npm run test:openai

# 测试 Anthropic
npm run test:anthropic

# 测试 Google Gemini
npm run test:gemini

# 测试 Azure OpenAI
npm run test:azure

# 测试 Ollama
npm run test:ollama

# 测试 OpenAI 兼容接口
npm run test:compatible
```

#### 测试所有提供商

```bash
npm run test:all
```

## 测试内容

每个测试脚本都包含以下测试场景：

### 1. 基础文本生成
使用 `generateText` API 进行简单的文本生成，测试基本的模型调用功能。

### 2. 流式文本生成
使用 `streamText` API 进行流式输出，测试实时响应功能。

### 3. 工具调用 (Tool Calling)
测试模型的函数调用能力，验证模型是否能正确识别和调用外部工具。

> **注意**: 并非所有提供商都支持工具调用功能，具体支持情况请参考各提供商文档。

## 目录结构

```
test/ai-sdk/
├── README.md                    # 本文件
├── package.json                 # 依赖配置
├── tsconfig.json               # TypeScript 配置
├── .env.example                # 环境变量示例
├── .env                        # 环境变量配置（需自行创建）
├── utils/                      # 工具函数
│   ├── config.ts              # 配置加载
│   └── logger.ts              # 日志工具
└── providers/                  # 提供商测试脚本
    ├── test-openai.ts
    ├── test-anthropic.ts
    ├── test-gemini.ts
    ├── test-azure-openai.ts
    ├── test-ollama.ts
    └── test-openai-compatible.ts
```

## 使用技巧

### Ollama 特别说明

Ollama 需要本地运行服务：

```bash
# 启动 Ollama 服务
ollama serve

# 拉取模型（如果还没有）
ollama pull llama3.2

# 运行测试
npm run test:ollama
```

### OpenAI 兼容接口

OpenAI 兼容接口可以用于测试各种第三方服务商，如：

- **硅基流动**: `https://api.siliconflow.cn/v1`
- **DeepSeek**: `https://api.deepseek.com/v1`
- **智谱 AI**: `https://open.bigmodel.cn/api/paas/v4`
- **月之暗面**: `https://api.moonshot.cn/v1`

只需在 `.env` 中配置对应的 `baseURL` 和 `apiKey` 即可。

### 自定义测试

你可以复制任一测试脚本并修改：

1. 修改模型 ID
2. 调整测试提示词
3. 添加新的工具函数
4. 测试更复杂的场景

## 常见问题

### Q: 测试失败怎么办？

A: 检查以下几点：
1. API Key 是否正确配置
2. 网络连接是否正常
3. 模型 ID 是否正确
4. 账户余额是否充足

### Q: 如何添加新的提供商？

A: 
1. 在 `providers/` 目录下创建新的测试脚本
2. 参考现有脚本的结构
3. 在 `package.json` 中添加对应的 npm script
4. 更新 README.md

### Q: 工具调用测试失败？

A: 部分模型或提供商可能不支持工具调用功能，这是正常现象。

## 参考资料

- [AI SDK 官方文档](https://ai-sdk.dev/)
- [AI SDK Providers](https://ai-sdk.dev/providers/ai-sdk-providers)
- [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)
- [GitHub Repository](https://github.com/vercel/ai)

## 许可证

MIT
