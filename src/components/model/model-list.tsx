"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ModelProvider } from "@/types/model";
import { useModelStore } from "@/stores/model-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Search, Cpu, Tags } from "lucide-react";
import { AddModelDialog } from "./add-model-dialog";

interface ModelListProps {
  provider: ModelProvider;
}

export function ModelList({ provider }: ModelListProps) {
  const [search, setSearch] = useState("");
  const [showAddModel, setShowAddModel] = useState(false);
  const toggleModel = useModelStore((s) => s.toggleModel);
  const removeModel = useModelStore((s) => s.removeModel);

  const filtered = search
    ? provider.models.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase()),
      )
    : provider.models;

  // 按 group 分组
  const groups: Record<string, typeof filtered> = {};
  for (const m of filtered) {
    const key = m.group || "其他";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  const groupKeys = Object.keys(groups).sort();

  return (
    <div className="p-4 pt-0 space-y-6">
      {/* 搜索 + 添加 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/20 focus-within:bg-background focus-within:ring-1 focus-within:ring-ring transition-all">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索模型名称或 ID..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button
          variant="default"
          className="h-10 px-4 shadow-sm"
          onClick={() => setShowAddModel(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          添加自定义模型
        </Button>
      </div>

      {/* 模型列表 */}
      {groupKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
          <Cpu className="h-10 w-10 mb-3 opacity-20" />
          <div className="text-sm">
            {search ? "没有找到匹配的模型" : "该服务商下暂无可用模型"}
          </div>
          {!search && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddModel(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              立即添加
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupKeys.map((group) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Tags className="h-4 w-4 text-muted-foreground" />
                {group}
                <Badge
                  variant="secondary"
                  className="ml-2 font-normal text-xs px-1.5 h-5 bg-muted/50 text-muted-foreground"
                >
                  {groups[group].length} 个模型
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {groups[group].map((model) => (
                  <div
                    key={model.id}
                    className={cn(
                      "group/model relative flex flex-col p-4 rounded-xl border transition-all duration-200",
                      model.enabled
                        ? "bg-card hover:border-primary/30 hover:shadow-sm"
                        : "bg-muted/30 border-dashed opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "text-sm truncate",
                              model.enabled
                                ? "font-semibold text-foreground"
                                : "font-medium text-muted-foreground",
                            )}
                          >
                            {model.name}
                          </h4>
                          {model.capabilities &&
                            model.capabilities.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-[9px] uppercase tracking-wider shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                              >
                                {model.capabilities[0]}
                              </Badge>
                            )}
                        </div>
                        <p
                          className="text-xs text-muted-foreground truncate mt-1 select-all"
                          title={model.id}
                        >
                          {model.id}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={model.enabled}
                          onCheckedChange={() =>
                            toggleModel(provider.id, model.id)
                          }
                          className="scale-90"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {model.capabilities?.slice(1).map((cap) => (
                          <Badge
                            key={cap}
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground border-border"
                          >
                            {cap}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover/model:opacity-100 transition-opacity text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={() => removeModel(provider.id, model.id)}
                        title="删除模型"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加模型对话框 */}
      <AddModelDialog
        open={showAddModel}
        onOpenChange={setShowAddModel}
        providerId={provider.id}
      />
    </div>
  );
}
