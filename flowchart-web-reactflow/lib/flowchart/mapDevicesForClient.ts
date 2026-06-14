import { canDeleteDevice } from "@/lib/flowchart/deviceDeletePermissions";
import { canResetFlowContent } from "@/lib/flowchart/flowResetPermissions";
import { canDeleteModule } from "@/lib/flowchart/moduleDeletePermissions";
import { canDeleteUnit } from "@/lib/flowchart/unitDeletePermissions";
import type { ProfileRole } from "@/lib/auth/types";

import type { Device, FlowModule } from "./moduleHierarchy";

export type ServerModule = FlowModule & {
  hasFlow?: boolean;
  flowCreatedBy?: string;
};

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
    canDelete: canDeleteDevice(role, userId, device),
    units: device.units.map((unit) => ({
      id: unit.id,
      label: unit.label,
      modules: unit.modules.map((mod) => {
        const serverMod = mod as ServerModule;
        return {
          id: mod.id,
          label: mod.label,
          legacyKey: mod.legacyKey,
          canReset: canResetFlowContent(role, userId, {
            hasFlow: serverMod.hasFlow ?? false,
            createdBy: serverMod.flowCreatedBy,
          }),
          canDelete: canDeleteModule(role, userId, device, unit),
        };
      }),
      canDelete: canDeleteUnit(role, userId, device, unit),
    })),
  }));
}

/** AUTH_DISABLED デモ装置 — 全モジュールに hasFlow を付与し canReset 等を算出 */
export function mapDemoDevicesForClient(
  devices: Device[],
  role: ProfileRole,
  userId: string | undefined
): Device[] {
  const withFlowMeta = devices.map((device) => ({
    ...device,
    ...(userId ? { createdBy: userId } : {}),
    units: device.units.map((unit) => ({
      ...unit,
      ...(userId ? { createdBy: userId } : {}),
      modules: unit.modules.map(
        (mod): ServerModule => ({
          ...mod,
          hasFlow: true,
          flowCreatedBy: userId,
        })
      ),
    })),
  }));
  return mapDevicesForClient(withFlowMeta, role, userId);
}
