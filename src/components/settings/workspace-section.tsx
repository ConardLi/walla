"use client";

import { useWorkspaceStore } from "@/stores/workspace-store";
import { FolderOpen, X, FolderPlus } from "lucide-react";
import * as ipc from "@/services/ipc-client";

export function WorkspaceSection() {
  const directories = useWorkspaceStore((s) => s.directories);
  const addDirectory = useWorkspaceStore((s) => s.addDirectory);
  const removeDirectory = useWorkspaceStore((s) => s.removeDirectory);

  const handleAddDir = async () => {
    const result = await ipc.selectDirectory();
    if (result?.path) {
      await addDirectory(result.path);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">工作目录</h2>
      <div className="space-y-2">
        {directories.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂未添加工作目录</p>
        ) : (
          <div className="space-y-1">
            {directories.map((dir) => (
              <div
                key={dir}
                className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm group"
              >
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate font-mono text-xs" title={dir}>
                  {dir}
                </span>
                <button
                  type="button"
                  onClick={() => removeDirectory(dir)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  title="移除"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddDir}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          添加工作目录
        </button>
      </div>
    </div>
  );
}
