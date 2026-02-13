import { useState, useCallback } from "react";
import * as ipc from "@/services/ipc-client";

export function useShellInput() {
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

  const sendInput = useCallback(async () => {
    const value = inputValue.trim();
    if (!value || sending) return;

    setSending(true);
    try {
      await ipc.shellWrite(value + "\n");
      setInputValue("");
    } finally {
      setSending(false);
    }
  }, [inputValue, sending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendInput();
      }
    },
    [sendInput],
  );

  const reset = useCallback(() => {
    setInputValue("");
    setSending(false);
  }, []);

  return {
    inputValue,
    setInputValue,
    sending,
    sendInput,
    handleKeyDown,
    reset,
  };
}
