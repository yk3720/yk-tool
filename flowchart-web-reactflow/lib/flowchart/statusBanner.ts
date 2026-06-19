export type StatusBannerTone = "neutral" | "success" | "error";

export function statusBannerTone(message: string): StatusBannerTone {
  if (/^(取込完了|ユニットを削除)/.test(message)) {
    return "success";
  }
  if (/^(取込失敗|削除失敗|クラウド保存に失敗)/.test(message)) {
    return "error";
  }
  return "neutral";
}

export function statusBannerClassName(tone: StatusBannerTone): string {
  switch (tone) {
    case "success":
      return "border-b border-flow-success-border bg-flow-success-bg text-flow-success-text";
    case "error":
      return "border-b bg-flow-danger-muted text-flow-danger-text";
    default:
      return "border-b bg-flow-warning-bg text-flow-warning-text";
  }
}
