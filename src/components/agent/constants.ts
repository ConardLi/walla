export const APPROVAL_MODE_LABELS: Record<string, string> = {
  default: "默认",
  auto: "全部放行",
  manual: "全部询问",
};

export const APPROVAL_MODE_DESCRIPTIONS: Record<string, string> = {
  default: "允许白名单中的命令自动执行，其他需要确认",
  auto: "所有操作自动放行，无需确认",
  manual: "所有操作都需要手动确认",
};

export const APPROVAL_MODE_COLORS: Record<string, string> = {
  default: "text-blue-500 border-blue-500/30",
  auto: "text-green-500 border-green-500/30",
  manual: "text-orange-500 border-orange-500/30",
};
