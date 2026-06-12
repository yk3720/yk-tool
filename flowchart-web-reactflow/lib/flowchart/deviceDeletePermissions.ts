import { isAdminRole } from "@/lib/auth/roles";
import type { ProfileRole } from "@/lib/auth/types";

import type { Device } from "./moduleHierarchy";

/** admin · 装置の登録者（devices.created_by） */
export function canDeleteDevice(
  role: ProfileRole,
  userId: string | undefined,
  device: Pick<Device, "createdBy">
): boolean {
  if (!userId || role === "viewer") return false;
  if (isAdminRole(role)) return true;
  return device.createdBy === userId;
}
