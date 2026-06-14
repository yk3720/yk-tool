import { isAdminRole } from "@/lib/auth/roles";
import type { ProfileRole } from "@/lib/auth/types";

import type { Device, FlowUnit } from "./moduleHierarchy";

/** admin · 装置登録者 · ユニット登録者（ユニット削除と同型 · #9d） */
export function canDeleteModule(
  role: ProfileRole,
  userId: string | undefined,
  device: Pick<Device, "createdBy">,
  unit: Pick<FlowUnit, "createdBy">
): boolean {
  if (!userId || role === "viewer") return false;
  if (isAdminRole(role)) return true;
  if (device.createdBy === userId) return true;
  if (unit.createdBy === userId) return true;
  return false;
}
