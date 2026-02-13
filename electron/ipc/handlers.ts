import type { BrowserWindow } from "electron";
import { ACPManagerRegistry } from "../services/acp";
import { MCPClientManager } from "../services/mcp";
import { registerSystemHandlers } from "./handlers/system-handlers";
import { registerAgentHandlers } from "./handlers/agent-handlers";
import { registerSessionHandlers } from "./handlers/session-handlers";
import { registerPromptHandlers } from "./handlers/prompt-handlers";
import { registerConfigHandlers } from "./handlers/config-handlers";
import { registerPermissionHandlers } from "./handlers/permission-handlers";
import { registerEventHandlers } from "./handlers/event-handlers";
import { registerSkillHandlers } from "./handlers/skill-handlers";
import { registerStorageHandlers } from "./handlers/storage-handlers";
import { registerDetectHandlers } from "./handlers/detect-handlers";
import { registerMCPHandlers } from "./handlers/mcp-handlers";

type WindowGetter = () => BrowserWindow | null;

/** 全局唯一多连接注册表 */
const registry = new ACPManagerRegistry();

/** MCP Client 管理器 */
const mcpManager = new MCPClientManager();

/**
 * 注册所有 IPC handlers
 */
export function registerIPCHandlers(getWindow: WindowGetter) {
  registerSystemHandlers();
  registerAgentHandlers(registry, getWindow);
  registerSessionHandlers(registry, getWindow);
  registerPromptHandlers(registry);
  registerConfigHandlers(registry);
  registerPermissionHandlers(registry, getWindow);
  registerEventHandlers(registry, getWindow);
  registerSkillHandlers();
  registerStorageHandlers();
  registerDetectHandlers();
  registerMCPHandlers(mcpManager);

  console.log("[IPC] All handlers registered");
}

export { registry, mcpManager };
