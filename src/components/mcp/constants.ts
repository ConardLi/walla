import type { MCPTransportType } from "@/types/mcp";

export const TRANSPORT_OPTIONS: Array<{
  value: MCPTransportType;
  label: string;
}> = [
  { value: "stdio", label: "Stdio" },
  { value: "sse", label: "SSE" },
];

export const EXAMPLE_JSON_STDIO = `{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "mcp-server-example"]
    }
  }
}`;

export const EXAMPLE_JSON_SSE = `{
  "mcpServers": {
    "my-server": {
      "type": "sse",
      "url": "http://localhost:3000"
    }
  }
}`;
