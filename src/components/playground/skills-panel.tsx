"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  FolderOpen,
  Loader2,
  RefreshCw,
  BookOpen,
  Download,
  Search,
} from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import * as ipc from "@/services/ipc-client";
import type { SkillInfo } from "@/shared/ipc-types";

const SKILL_TEMPLATE = `---
name: my-skill
description: Describe what this skill does and when to use it.
---

# My Skill

## When to use this skill

Use this skill when the user needs to...

## Instructions

1. Step one...
2. Step two...
3. Step three...
`;

export function SkillsPanel() {
  const [targetDir, setTargetDir] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillContent, setSkillContent] = useState(SKILL_TEMPLATE);
  const [installedSkills, setInstalledSkills] = useState<SkillInfo[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  // 当 activeSession 变化时，自动填充 targetDir
  useEffect(() => {
    if (activeSessionId) {
      const session = sessions.find((s) => s.sessionId === activeSessionId);
      if (session?.cwd && !targetDir) {
        setTargetDir(session.cwd);
      }
    }
  }, [activeSessionId, sessions, targetDir]);

  // 从 SKILL.md 内容中提取 name
  useEffect(() => {
    const match = skillContent.match(/^name:\s*(.+)$/m);
    if (match) {
      setSkillName(match[1].trim());
    }
  }, [skillContent]);

  const loadSkills = async () => {
    if (!targetDir.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await ipc.skillList({ targetDir: targetDir.trim() });
      setInstalledSkills(result.skills);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!targetDir.trim() || !skillName.trim() || !skillContent.trim()) return;
    setIsInstalling(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await ipc.skillInstall({
        targetDir: targetDir.trim(),
        skillName: skillName.trim(),
        skillContent: skillContent,
      });
      setSuccessMsg(`Skill "${skillName}" 已安装到 ${result.path}`);
      // 刷新列表
      await loadSkills();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemove = async (name: string) => {
    if (!targetDir.trim()) return;
    setError(null);
    try {
      await ipc.skillRemove({
        targetDir: targetDir.trim(),
        skillName: name,
      });
      await loadSkills();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      {/* 说明 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Agent Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            Skills 是一种轻量级的开放格式，通过 SKILL.md
            文件为 Agent 提供专业知识和工作流。
          </p>
          <p>
            Agent 会在 session 的工作目录下发现 skills。将 skill
            安装到目标目录的 <code className="bg-muted px-1 rounded">.skills/</code>{" "}
            子目录中，创建 session 时指定该目录作为 cwd，Agent 即可使用这些 skills。
          </p>
        </CardContent>
      </Card>

      {/* 目标目录 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            目标目录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
              placeholder="Skill 安装目标目录 (即 session 的 cwd)"
              className="flex-1 text-xs font-mono"
            />
            {ipc.isElectron() && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const result = await ipc.selectDirectory();
                  if (result.path) setTargetDir(result.path);
                }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {sessions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">
                快速选择已有 session 的 cwd:
              </span>
              <div className="flex flex-wrap gap-1">
                {[...new Set(sessions.map((s) => s.cwd))].map((cwd) => (
                  <Button
                    key={cwd}
                    size="sm"
                    variant={targetDir === cwd ? "default" : "outline"}
                    className="text-[10px] h-6 px-2"
                    onClick={() => setTargetDir(cwd)}
                  >
                    {cwd.length > 30
                      ? "..." + cwd.slice(-30)
                      : cwd}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 已安装的 Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              已安装的 Skills
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs px-2"
              onClick={loadSkills}
              disabled={!targetDir.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              扫描
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {installedSkills.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              {targetDir.trim()
                ? "未发现已安装的 skill，点击「扫描」刷新"
                : "请先设置目标目录"}
            </p>
          ) : (
            <div className="space-y-1.5">
              {installedSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center gap-2 p-2 rounded-md border text-xs"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{skill.name}</div>
                    {skill.description && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {skill.description}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                    installed
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(skill.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑 & 安装 Skill */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            安装 Skill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-muted-foreground shrink-0">
              名称:
            </span>
            <Input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="skill-name (小写字母+连字符)"
              className="text-xs font-mono"
            />
          </div>

          <div>
            <span className="text-xs text-muted-foreground">SKILL.md 内容:</span>
            <textarea
              value={skillContent}
              onChange={(e) => setSkillContent(e.target.value)}
              className="w-full mt-1 rounded-md border bg-background px-3 py-2 text-xs font-mono min-h-[200px] max-h-[400px] resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="粘贴或编辑 SKILL.md 内容..."
            />
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={handleInstall}
            disabled={
              isInstalling ||
              !targetDir.trim() ||
              !skillName.trim() ||
              !skillContent.trim()
            }
          >
            {isInstalling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {isInstalling
              ? "安装中..."
              : `安装到 .skills/${skillName || "<name>"}/`}
          </Button>

          {successMsg && (
            <p className="text-xs text-green-600">{successMsg}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
