"use client";

import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  MessageSquareText,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { MCPTool, MCPPrompt, MCPResource } from "@/types/mcp";

function ToolItem({ tool }: { tool: MCPTool }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <Wrench className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        <span className="text-sm font-medium truncate">{tool.name}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-2 pt-0 space-y-1">
          {tool.description && (
            <p className="text-xs text-muted-foreground">{tool.description}</p>
          )}
          {tool.inputSchema && (
            <pre className="text-[11px] font-mono bg-muted/50 rounded p-2 overflow-auto max-h-32">
              {JSON.stringify(tool.inputSchema, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function PromptItem({ prompt }: { prompt: MCPPrompt }) {
  return (
    <div className="border rounded-md px-3 py-2">
      <div className="flex items-center gap-2">
        <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-purple-500" />
        <span className="text-sm font-medium">{prompt.name}</span>
      </div>
      {prompt.description && (
        <p className="text-xs text-muted-foreground mt-1 ml-5.5">
          {prompt.description}
        </p>
      )}
      {prompt.arguments && prompt.arguments.length > 0 && (
        <div className="mt-1 ml-5.5 flex flex-wrap gap-1">
          {prompt.arguments.map((arg) => (
            <Badge
              key={arg.name}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {arg.name}
              {arg.required && <span className="text-red-500 ml-0.5">*</span>}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceItem({ resource }: { resource: MCPResource }) {
  return (
    <div className="border rounded-md px-3 py-2">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-green-500" />
        <span className="text-sm font-medium truncate">{resource.name}</span>
        {resource.mimeType && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {resource.mimeType}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 ml-5.5 truncate">
        {resource.uri}
      </p>
      {resource.description && (
        <p className="text-xs text-muted-foreground mt-0.5 ml-5.5">
          {resource.description}
        </p>
      )}
    </div>
  );
}

interface ServerDetailProps {
  tools: MCPTool[];
  prompts: MCPPrompt[];
  resources: MCPResource[];
}

export function ServerDetail({ tools, prompts, resources }: ServerDetailProps) {
  const hasContent = tools.length > 0 || prompts.length > 0 || resources.length > 0;

  if (!hasContent) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        该服务器未提供任何工具、提示词或资源
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {tools.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wrench className="h-3 w-3" />
            工具 ({tools.length})
          </h4>
          <div className="space-y-1.5">
            {tools.map((tool) => (
              <ToolItem key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {prompts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquareText className="h-3 w-3" />
            提示词 ({prompts.length})
          </h4>
          <div className="space-y-1.5">
            {prompts.map((prompt) => (
              <PromptItem key={prompt.name} prompt={prompt} />
            ))}
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            资源 ({resources.length})
          </h4>
          <div className="space-y-1.5">
            {resources.map((resource) => (
              <ResourceItem key={resource.uri} resource={resource} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
