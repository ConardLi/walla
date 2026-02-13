"use client";

import { useState, useEffect, useCallback } from "react";
import { AGENTS, type AgentDefinition } from "@/constants/agent";
import { isElectron, detectAgentCli } from "@/services/ipc-client";

export type DetectStatus = "idle" | "detecting" | "done";

export interface AgentDetectResult {
  agent: AgentDefinition;
  available: boolean;
}

export function useAgentDetect() {
  const [status, setStatus] = useState<DetectStatus>("idle");
  const [results, setResults] = useState<AgentDetectResult[]>([]);

  const detect = useCallback(async () => {
    if (!isElectron()) {
      setResults(AGENTS.map((a) => ({ agent: a, available: false })));
      setStatus("done");
      return;
    }

    setStatus("detecting");

    try {
      // 提取每个 agent 的主命令（cli[0]）
      const commands = AGENTS.map((a) => a.cli[0]);
      const unique = [...new Set(commands)];
      const detected = await detectAgentCli(unique);

      setResults(
        AGENTS.map((a) => ({
          agent: a,
          available: !!detected[a.cli[0]],
        })),
      );
    } catch {
      setResults(AGENTS.map((a) => ({ agent: a, available: false })));
    } finally {
      setStatus("done");
    }
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  // 可连接的排前面
  const sorted = [...results].sort((a, b) => {
    if (a.available === b.available) return 0;
    return a.available ? -1 : 1;
  });

  return { status, results: sorted, refresh: detect };
}
