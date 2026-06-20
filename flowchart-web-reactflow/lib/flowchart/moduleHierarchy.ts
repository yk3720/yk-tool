export type FlowModule = {
  /** modules.id (uuid) — flow_documents FK */
  id: string;
  label: string;
  /** DB modules.legacy_key — 旧 localStorage / offline キー解決用 */
  legacyKey?: string;
  /** サーバーで算出したフロー中身リセット可否（クライアント表示用） */
  canReset?: boolean;
  /** サーバーで算出した削除可否（クライアント表示用） */
  canDelete?: boolean;
};

export type FlowUnit = {
  id: string;
  label: string;
  modules: FlowModule[];
  /** import 時の登録者（units.created_by）— サーバー内部のみ。クライアントには渡さない */
  createdBy?: string;
  /** サーバーで算出した削除可否（クライアント表示用） */
  canDelete?: boolean;
};

export type Device = {
  id: string;
  /** devices.internal_code — 社内番号（1 装置 = 1 コード · 012 で equipment_codes 統合） */
  internalCode?: string;
  name: string;
  units: FlowUnit[];
  /** import 時の登録者（devices.created_by） */
  createdBy?: string;
  /** サーバーで算出した装置削除可否（クライアント表示用） */
  canDelete?: boolean;
};

/** 永続化キー（localStorage · クラウド · IndexedDB 共通）— modules.id uuid */
export function moduleStorageKey(moduleUuid: string): string {
  return moduleUuid;
}

/** @deprecated DB-2 以前 — moduleStorageKey(moduleUuid) を使用 */
export function moduleDraftKey(_deviceId: string, moduleId: string): string {
  return moduleId;
}

/** Phase 3 デモ — プレス機 A（004 seed と同一 uuid） */
export const DEMO_DEVICE_PRESS_A: Device = {
  id: "a0000001-0001-4001-8001-000000000001",
  internalCode: "DEMO-001",
  name: "プレス機 A",
  units: [
    {
      id: "b0000001-0001-4001-8001-000000000101",
      label: "供給ユニット",
      modules: [
        {
          id: "c0000001-0001-4001-8001-000000001001",
          label: "供給動作",
          legacyKey: "DEMO-001:supply-feed",
        },
        {
          id: "c0000001-0001-4001-8001-000000001002",
          label: "検知動作",
          legacyKey: "DEMO-001:supply-detect",
        },
      ],
    },
    {
      id: "b0000001-0001-4001-8001-000000000102",
      label: "プレスユニット",
      modules: [
        {
          id: "c0000001-0001-4001-8001-000000001003",
          label: "プレス動作",
          legacyKey: "DEMO-001:press-cycle",
        },
        {
          id: "c0000001-0001-4001-8001-000000001004",
          label: "離脱動作",
          legacyKey: "DEMO-001:press-release",
        },
      ],
    },
    {
      id: "b0000001-0001-4001-8001-000000000103",
      label: "収納ユニット",
      modules: [
        {
          id: "c0000001-0001-4001-8001-000000001005",
          label: "排出動作",
          legacyKey: "DEMO-001:storage-eject",
        },
      ],
    },
  ],
};

/** Phase 3 デモ — プレス機 B（004 seed と同一 uuid） */
export const DEMO_DEVICE_PRESS_B: Device = {
  id: "a0000001-0001-4001-8001-000000000002",
  internalCode: "DEMO-002",
  name: "プレス機 B",
  units: [
    {
      id: "b0000002-0001-4001-8001-000000000201",
      label: "供給ユニット",
      modules: [
        {
          id: "c0000002-0001-4001-8001-000000002001",
          label: "供給動作",
          legacyKey: "DEMO-002:b-supply-feed",
        },
        {
          id: "c0000002-0001-4001-8001-000000002002",
          label: "検知動作",
          legacyKey: "DEMO-002:b-supply-detect",
        },
      ],
    },
    {
      id: "b0000002-0001-4001-8001-000000000202",
      label: "プレスユニット",
      modules: [
        {
          id: "c0000002-0001-4001-8001-000000002003",
          label: "プレス動作",
          legacyKey: "DEMO-002:b-press-cycle",
        },
        {
          id: "c0000002-0001-4001-8001-000000002004",
          label: "離脱動作",
          legacyKey: "DEMO-002:b-press-release",
        },
      ],
    },
    {
      id: "b0000002-0001-4001-8001-000000000203",
      label: "収納ユニット",
      modules: [
        {
          id: "c0000002-0001-4001-8001-000000002005",
          label: "排出動作",
          legacyKey: "DEMO-002:b-storage-eject",
        },
      ],
    },
  ],
};

export const DEMO_DEVICES: Device[] = [
  DEMO_DEVICE_PRESS_A,
  DEMO_DEVICE_PRESS_B,
];

/** @deprecated 互換 — プレス機 A */
export const DEMO_DEVICE = DEMO_DEVICE_PRESS_A;

/** 装置ドロップダウン — 社内番号：display_name */
export function formatDeviceSelectLabel(device: {
  name: string;
  internalCode?: string;
}): string {
  const code = device.internalCode?.trim();
  return code ? `${code}：${device.name}` : device.name;
}

export function findDevice(
  devices: readonly Device[],
  deviceId: string
): Device | null {
  return devices.find((d) => d.id === deviceId) ?? null;
}

export function findModule(
  device: Device,
  moduleId: string
): { unit: FlowUnit; module: FlowModule } | null {
  for (const unit of device.units) {
    const mod = unit.modules.find((m) => m.id === moduleId);
    if (mod) return { unit, module: mod };
  }
  return null;
}

export function findModuleInDevices(
  devices: readonly Device[],
  moduleId: string
): { device: Device; unit: FlowUnit; module: FlowModule } | null {
  for (const device of devices) {
    const found = findModule(device, moduleId);
    if (found) return { device, ...found };
  }
  return null;
}

export function hasModuleInDevices(
  devices: readonly Device[],
  moduleId: string
): boolean {
  return findModuleInDevices(devices, moduleId) !== null;
}

/** 削除直後のナビ反映用 — 指定モジュールを除外した装置ツリーを返す */
export function excludeModulesFromDevices(
  devices: readonly Device[],
  excludedModuleIds: ReadonlySet<string>
): Device[] {
  if (excludedModuleIds.size === 0) {
    return [...devices];
  }
  return devices.map((device) => ({
    ...device,
    units: device.units
      .map((unit) => ({
        ...unit,
        modules: unit.modules.filter((m) => !excludedModuleIds.has(m.id)),
      }))
      .filter((unit) => unit.modules.length > 0),
  }));
}

/** 読込用 — uuid 優先 · 旧 text キーへフォールバック */
export function resolveModuleDraftKeys(
  module: FlowModule,
  device: Device
): string[] {
  const keys = [moduleStorageKey(module.id)];

  if (module.legacyKey) {
    keys.push(module.legacyKey);
    const slug = module.legacyKey.split(":")[1];
    if (slug) {
      if (device.internalCode === "DEMO-001") {
        keys.push(`press-01:${slug}`, slug);
      } else if (device.internalCode === "DEMO-002") {
        keys.push(`press-02:${slug}`);
      }
    }
  }

  return [...new Set(keys)];
}

/** @deprecated resolveModuleDraftKeys(module, device) を使用 */
export function resolveModuleDraftKey(
  deviceId: string,
  moduleId: string
): string[] {
  const device = findDevice(DEMO_DEVICES, deviceId);
  const found = device ? findModule(device, moduleId) : null;
  if (found) {
    return resolveModuleDraftKeys(found.module, device!);
  }
  return [moduleDraftKey(deviceId, moduleId)];
}
