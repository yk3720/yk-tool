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
      return "border-b border-green-200 bg-green-50 text-green-900";
    case "error":
      return "border-b border-red-200 bg-red-50 text-red-900";
    default:
      return "border-b border-amber-100 bg-amber-50 text-amber-900";
  }
}
