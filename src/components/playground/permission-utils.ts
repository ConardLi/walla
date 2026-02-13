import type { PermissionRequest } from "@/services/event-listener";

export interface WhitelistInfo {
  type: "tool" | "command";
  value: string;
}

/** kind 包含这些关键词时视为命令类工具 */
const COMMAND_KIND_KEYWORDS = [
  "bash",
  "terminal",
  "command",
  "shell",
  "exec",
  "run",
];

function isCommandKind(kind?: string): boolean {
  if (!kind) return false;
  const lower = kind.toLowerCase();
  return COMMAND_KIND_KEYWORDS.some((kw) => lower.includes(kw));
}

export function extractWhitelistInfo(
  req: PermissionRequest,
): WhitelistInfo | null {
  const tc = req.toolCall;

  // 解析 rawInput
  let rawInput = tc.rawInput;
  if (typeof rawInput === "string") {
    try {
      rawInput = JSON.parse(rawInput);
    } catch {
      /* ignore */
    }
  }

  // 尝试从 rawInput 中提取 command 字段
  if (rawInput && typeof rawInput === "object") {
    const input = rawInput as Record<string, unknown>;
    const command = input.command as string | undefined;
    if (command) {
      const baseCmd = command.trim().split(/\s+/)[0];
      if (baseCmd) {
        return { type: "command", value: baseCmd };
      }
    }
  }

  // 通过 kind 判断：如果是命令类工具，title 应加入命令白名单
  if (isCommandKind(tc.kind) && tc.title) {
    // title 可能就是完整命令，取首段
    const baseCmd = tc.title.trim().split(/\s+/)[0];
    if (baseCmd) {
      return { type: "command", value: baseCmd };
    }
  }

  // 非命令类 → 工具白名单
  const toolName = tc.title;
  if (toolName) {
    return { type: "tool", value: toolName };
  }

  return null;
}
