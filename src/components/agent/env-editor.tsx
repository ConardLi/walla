"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnvEditorProps {
  value: Record<string, string>;
  onChange: (env: Record<string, string>) => void;
}

interface EnvEntry {
  id: string;
  key: string;
  value: string;
}

let nextId = 0;
function genEntryId() {
  return `env-${++nextId}`;
}

function toEntries(env: Record<string, string>): EnvEntry[] {
  const entries = Object.entries(env).map(([key, value]) => ({
    id: genEntryId(),
    key,
    value,
  }));
  return entries.length > 0 ? entries : [];
}

function toRecord(entries: EnvEntry[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.key.trim()) {
      record[entry.key.trim()] = entry.value;
    }
  }
  return record;
}

export function EnvEditor({ value, onChange }: EnvEditorProps) {
  const [entries, setEntries] = useState<EnvEntry[]>(() => toEntries(value));

  const updateEntries = (newEntries: EnvEntry[]) => {
    setEntries(newEntries);
    onChange(toRecord(newEntries));
  };

  const handleAdd = () => {
    updateEntries([...entries, { id: genEntryId(), key: "", value: "" }]);
  };

  const handleRemove = (id: string) => {
    updateEntries(entries.filter((e) => e.id !== id));
  };

  const handleChange = (
    id: string,
    field: "key" | "value",
    val: string,
  ) => {
    updateEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    );
  };

  return (
    <div className="space-y-2">
      {entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-1.5">
              <Input
                value={entry.key}
                onChange={(e) => handleChange(entry.id, "key", e.target.value)}
                placeholder="KEY"
                className="flex-1 font-mono text-xs h-8"
              />
              <span className="text-muted-foreground text-xs">=</span>
              <Input
                value={entry.value}
                onChange={(e) =>
                  handleChange(entry.id, "value", e.target.value)
                }
                placeholder="VALUE"
                className="flex-1 font-mono text-xs h-8"
              />
              <button
                type="button"
                onClick={() => handleRemove(entry.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
        )}
      >
        <Plus className="h-3 w-3" />
        添加环境变量
      </button>
    </div>
  );
}
