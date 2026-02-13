/**
 * 清理 Electron IPC 错误消息
 *
 * Electron IPC 会将错误包装为：
 *   "Error invoking remote method 'xxx': yyy"
 * 其中 yyy 可能是 JSON 字符串或 [object Object]
 *
 * 此函数提取可读的错误信息
 */
export function cleanErrorMessage(raw: string): string {
  // 去除 Electron IPC 前缀
  const ipcPrefix = /^Error invoking remote method '[^']+': /;
  let msg = raw.replace(ipcPrefix, "");

  // 去除 "Error: " 前缀
  if (msg.startsWith("Error: ")) {
    msg = msg.slice(7);
  }

  // 尝试解析 JSON 格式的错误信息
  if (msg.startsWith("{")) {
    try {
      const parsed = JSON.parse(msg);
      if (typeof parsed.message === "string") {
        return parsed.message;
      }
      if (typeof parsed.detail === "string") {
        return parsed.detail;
      }
    } catch {
      // 不是有效 JSON
    }
  }

  return msg;
}
