import { canDeleteDevice } from "@/lib/flowchart/deviceDeletePermissions";
import { canResetFlowContent } from "@/lib/flowchart/flowResetPermissions";
import { canDeleteUnit } from "@/lib/flowchart/unitDeletePermissions";
import type { ProfileRole } from "@/lib/auth/types";

import type { Device, FlowModule } from "./moduleHierarchy";

type ServerModule = FlowModule & {
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
        };
      }),
      canDelete: canDeleteUnit(role, userId, device, unit),
    })),
  }));
}
