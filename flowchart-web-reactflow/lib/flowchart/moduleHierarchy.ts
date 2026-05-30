export type FlowModule = {
  id: string;
  label: string;
};

export type FlowUnit = {
  id: string;
  label: string;
  modules: FlowModule[];
};

export type Device = {
  id: string;
  name: string;
  units: FlowUnit[];
};

/** 永続化キー（localStorage · クラウド · IndexedDB 共通） */
export function moduleDraftKey(deviceId: string, moduleId: string): string {
  return `${deviceId}:${moduleId}`;
}

/** Phase 3 デモ — プレス機 A */
export const DEMO_DEVICE_PRESS_A: Device = {
  id: "press-01",
  name: "プレス機 A",
  units: [
    {
      id: "supply",
      label: "供給ユニット",
      modules: [
        { id: "supply-feed", label: "供給動作" },
        { id: "supply-detect", label: "検知動作" },
      ],
    },
    {
      id: "press",
      label: "プレスユニット",
      modules: [
        { id: "press-cycle", label: "プレス動作" },
        { id: "press-release", label: "離脱動作" },
      ],
    },
    {
      id: "storage",
      label: "収納ユニット",
      modules: [{ id: "storage-eject", label: "排出動作" }],
    },
  ],
};

/** Phase 3 デモ — プレス機 B（モジュール ID は装置ごとに一意） */
export const DEMO_DEVICE_PRESS_B: Device = {
  id: "press-02",
  name: "プレス機 B",
  units: [
    {
      id: "b-supply",
      label: "供給ユニット",
      modules: [
        { id: "b-supply-feed", label: "供給動作" },
        { id: "b-supply-detect", label: "検知動作" },
      ],
    },
    {
      id: "b-press",
      label: "プレスユニット",
      modules: [
        { id: "b-press-cycle", label: "プレス動作" },
        { id: "b-press-release", label: "離脱動作" },
      ],
    },
    {
      id: "b-storage",
      label: "収納ユニット",
      modules: [{ id: "b-storage-eject", label: "排出動作" }],
    },
  ],
};

export const DEMO_DEVICES: Device[] = [
  DEMO_DEVICE_PRESS_A,
  DEMO_DEVICE_PRESS_B,
];

/** @deprecated 互換 — プレス機 A */
export const DEMO_DEVICE = DEMO_DEVICE_PRESS_A;

export function findDevice(
  devices: readonly Device[],
  deviceId: string,
): Device | null {
  return devices.find((d) => d.id === deviceId) ?? null;
}

export function findModule(
  device: Device,
  moduleId: string,
): { unit: FlowUnit; module: FlowModule } | null {
  for (const unit of device.units) {
    const mod = unit.modules.find((m) => m.id === moduleId);
    if (mod) return { unit, module: mod };
  }
  return null;
}

export function findModuleInDevices(
  devices: readonly Device[],
  moduleId: string,
): { device: Device; unit: FlowUnit; module: FlowModule } | null {
  for (const device of devices) {
    const found = findModule(device, moduleId);
    if (found) return { device, ...found };
  }
  return null;
}

/** press-01 の旧キー（device プレフィックスなし） */
const LEGACY_MODULE_IDS = new Set(
  DEMO_DEVICE_PRESS_A.units.flatMap((u) => u.modules.map((m) => m.id)),
);

/** 読込用 — 旧 localStorage キーへフォールバック（press-01 のみ） */
export function resolveModuleDraftKey(
  deviceId: string,
  moduleId: string,
): string[] {
  const primary = moduleDraftKey(deviceId, moduleId);
  if (
    deviceId === DEMO_DEVICE_PRESS_A.id &&
    LEGACY_MODULE_IDS.has(moduleId)
  ) {
    return [primary, moduleId];
  }
  return [primary];
}
