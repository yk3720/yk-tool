import { canDeleteUnit } from "@/lib/flowchart/unitDeletePermissions";
import type { ProfileRole } from "@/lib/auth/types";

import type { Device } from "./moduleHierarchy";

/** クライアントへは createdBy を渡さず、削除可否のみ付与する */
export function mapDevicesForClient(
  devices: Device[],
  role: ProfileRole,
  userId: string | undefined
): Device[] {
  return devices.map((device) => ({
    id: device.id,
    internalCode: device.internalCode,
    name: device.name,
    units: device.units.map((unit) => ({
      id: unit.id,
      label: unit.label,
      modules: unit.modules,
      canDelete: canDeleteUnit(role, userId, device, unit),
    })),
  }));
}
