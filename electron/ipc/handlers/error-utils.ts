/**
 * 从 ACP 错误中提取可读的错误信息
 * ACP SDK 的错误 data 可能是对象，Electron IPC 序列化时会变成 [object Object]
 */
export function extractErrorMessage(err: unknown): string {
  console.log(1111, err);
  if (err instanceof Error) {
    // 检查是否有 data 字段（ACP RPC 错误）
    const rpcErr = err as Error & { data?: unknown };
    if (rpcErr.data && typeof rpcErr.data === "object") {
      const data = rpcErr.data as Record<string, unknown>;
      // 优先取 data.message
      if (typeof data.message === "string") {
        return data.message;
      }
      // 否则 stringify 整个 data
      return `${err.message}: ${JSON.stringify(data)}`;
    }

    // err.message 本身可能是 JSON 字符串（如 ACP RPC 错误序列化后的结果）
    // 例如: '{"code":-32000,"message":"Authentication required..."}'
    const msg = err.message;
    if (msg.startsWith("{")) {
      try {
        const parsed = JSON.parse(msg);
        if (typeof parsed.message === "string") {
          return parsed.message;
        }
      } catch {
        // 不是有效 JSON，使用原始 message
      }
    }

    return msg;
  }
  if (typeof err === "string") return err;
  return JSON.stringify(err);
}
