/**
 * Skills IPC handlers: install, list, remove
 * 将 SKILL.md 文件写入/读取/删除指定目录下的 .skills/ 子目录
 */

import { ipcMain } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import { IPC_CHANNELS } from "../../../src/shared/ipc-channels";

const SKILLS_DIR = ".skills";

interface SkillFrontmatter {
  name?: string;
  description?: string;
}

function parseSkillFrontmatter(content: string): SkillFrontmatter {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: SkillFrontmatter = {};

  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) result.description = descMatch[1].trim();

  return result;
}

export function registerSkillHandlers(): void {
  // skill:install — 将 SKILL.md 写入 <targetDir>/.skills/<skillName>/SKILL.md
  ipcMain.handle(IPC_CHANNELS.SKILL_INSTALL, async (_event, params) => {
    const { targetDir, skillName, skillContent } = params as {
      targetDir: string;
      skillName: string;
      skillContent: string;
    };

    const skillDir = path.join(targetDir, SKILLS_DIR, skillName);
    fs.mkdirSync(skillDir, { recursive: true });

    const skillPath = path.join(skillDir, "SKILL.md");
    fs.writeFileSync(skillPath, skillContent, "utf-8");

    console.log(`[Skills] Installed skill "${skillName}" to ${skillPath}`);
    return { ok: true, path: skillPath };
  });

  // skill:list — 扫描 <targetDir>/.skills/ 下所有 skill
  ipcMain.handle(IPC_CHANNELS.SKILL_LIST, async (_event, params) => {
    const { targetDir } = params as { targetDir: string };
    const skillsRoot = path.join(targetDir, SKILLS_DIR);

    if (!fs.existsSync(skillsRoot)) {
      return { skills: [] };
    }

    const entries = fs.readdirSync(skillsRoot, { withFileTypes: true });
    const skills: Array<{
      name: string;
      description: string;
      path: string;
    }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMdPath = path.join(skillsRoot, entry.name, "SKILL.md");
      if (!fs.existsSync(skillMdPath)) continue;

      const content = fs.readFileSync(skillMdPath, "utf-8");
      const meta = parseSkillFrontmatter(content);

      skills.push({
        name: meta.name ?? entry.name,
        description: meta.description ?? "",
        path: skillMdPath,
      });
    }

    return { skills };
  });

  // skill:remove — 删除 <targetDir>/.skills/<skillName>/
  ipcMain.handle(IPC_CHANNELS.SKILL_REMOVE, async (_event, params) => {
    const { targetDir, skillName } = params as {
      targetDir: string;
      skillName: string;
    };

    const skillDir = path.join(targetDir, SKILLS_DIR, skillName);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
      console.log(`[Skills] Removed skill "${skillName}" from ${skillDir}`);
    }

    return { ok: true };
  });

  console.log("[IPC] Skill handlers registered");
}
