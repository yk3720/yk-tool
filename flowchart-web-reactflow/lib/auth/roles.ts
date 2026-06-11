import type { ProfileRole } from "./types";

/** profiles.role の許可値（DB check と同期 · M-3 SSOT） */
export const PROFILE_ROLES = ["editor", "viewer", "admin"] as const;

export function isAppRole(value: string): value is ProfileRole {
  return value === "editor" || value === "viewer" || value === "admin";
}

export function isAdminRole(role: ProfileRole): boolean {
  return role === "admin";
}

/** フロー編集・クラウド保存（editor または admin） */
export function canEditFlowchart(role: ProfileRole): boolean {
  return role === "editor" || role === "admin";
}

export function getRoleLabel(role: ProfileRole): string {
  if (role === "admin") return "管理者";
  if (role === "editor") return "編集者";
  return "閲覧者";
}
