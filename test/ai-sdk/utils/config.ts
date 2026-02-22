import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY1 || "",
    baseURL: process.env.ANTHROPIC_BASE_URL1 || "",
    model: process.env.ANTHROPIC_MODEL1 || "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    baseURL: process.env.GEMINI_BASE_URL || "",
    model: process.env.GEMINI_MODEL || "",
  },
  azure: {
    resourceName: process.env.AZURE_RESOURCE_NAME || "",
    apiKey: process.env.AZURE_API_KEY || "",
    deploymentName: process.env.AZURE_DEPLOYMENT_NAME || "",
  },
  ollama: {
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
  },
  openaiCompatible: {
    baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL || "",
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY || "",
    model: process.env.OPENAI_COMPATIBLE_MODEL || "",
  },
  openaiResponses: {
    baseURL: process.env.OPENAI_RESPONSE_BASE_URL || "",
    apiKey: process.env.OPENAI_RESPONSE_API_KEY || "",
    model: process.env.OPENAI_RESPONSE_MODEL || "",
  },
};

console.log(111, config);

export function checkEnvVar(name: string, value: string): boolean {
  if (!value) {
    console.warn(`⚠️  环境变量 ${name} 未设置`);
    return false;
  }
  return true;
}
