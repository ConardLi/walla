import { AGENTS } from "@/constants/agent";

/**
 * 根据 Agent 连接名称匹配常量定义的图标路径
 * 返回 /agent-img/xxx.svg 或 null
 */
export function getAgentIconByName(name: string): string | null {
  const match = AGENTS.find(
    (a) => a.name.toLowerCase() === name.toLowerCase(),
  );
  return match ? `/agent-img/${match.icon}` : null;
}
