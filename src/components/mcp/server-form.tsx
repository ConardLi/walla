"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { TRANSPORT_OPTIONS } from "./constants";
import type { MCPTransportType } from "@/types/mcp";

export interface ServerFormData {
  name: string;
  description: string;
  transportType: MCPTransportType;
  command: string;
  args: string[];
  env: Array<{ key: string; value: string }>;
  url: string;
}

export function getDefaultFormData(): ServerFormData {
  return {
    name: "",
    description: "",
    transportType: "stdio",
    command: "",
    args: [],
    env: [],
    url: "",
  };
}

interface ServerFormProps {
  data: ServerFormData;
  onChange: (data: ServerFormData) => void;
}

export function ServerForm({ data, onChange }: ServerFormProps) {
  const update = <K extends keyof ServerFormData>(
    key: K,
    value: ServerFormData[K],
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">名称 *</label>
        <Input
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="MCP Server 名称"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">描述</label>
        <Input
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="可选描述"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">连接类型</label>
        <div className="flex gap-2">
          {TRANSPORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("transportType", opt.value)}
              className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                data.transportType === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {data.transportType === "stdio" ? (
        <StdioFields data={data} onChange={onChange} />
      ) : (
        <SSEFields data={data} onChange={onChange} />
      )}
    </div>
  );
}

function StdioFields({ data, onChange }: ServerFormProps) {
  const update = <K extends keyof ServerFormData>(
    key: K,
    value: ServerFormData[K],
  ) => {
    onChange({ ...data, [key]: value });
  };

  const [argsInput, setArgsInput] = useState(data.args.join(" "));

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">命令 *</label>
        <Input
          value={data.command}
          onChange={(e) => update("command", e.target.value)}
          placeholder="例如: npx, node, python"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">参数</label>
        <Input
          value={argsInput}
          onChange={(e) => {
            setArgsInput(e.target.value);
            const args = e.target.value
              .split(/\s+/)
              .filter((s) => s.length > 0);
            update("args", args);
          }}
          placeholder="空格分隔，例如: -y mcp-server-example"
        />
        {data.args.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.args.map((arg, i) => (
              <span
                key={i}
                className="text-[11px] px-1.5 py-0.5 bg-muted rounded font-mono"
              >
                {arg}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">环境变量</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => update("env", [...data.env, { key: "", value: "" }])}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加
          </Button>
        </div>
        {data.env.map((pair, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              value={pair.key}
              onChange={(e) => {
                const next = [...data.env];
                next[idx] = { ...next[idx], key: e.target.value };
                update("env", next);
              }}
              placeholder="KEY"
              className="flex-1 font-mono text-xs"
            />
            <span className="text-muted-foreground">=</span>
            <Input
              value={pair.value}
              onChange={(e) => {
                const next = [...data.env];
                next[idx] = { ...next[idx], value: e.target.value };
                update("env", next);
              }}
              placeholder="VALUE"
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => {
                update(
                  "env",
                  data.env.filter((_, i) => i !== idx),
                );
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

function SSEFields({ data, onChange }: ServerFormProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">URL *</label>
      <Input
        value={data.url}
        onChange={(e) => onChange({ ...data, url: e.target.value })}
        placeholder="http://localhost:3000"
      />
    </div>
  );
}
