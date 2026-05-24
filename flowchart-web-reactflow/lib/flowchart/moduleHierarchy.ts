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

/** Phase 3 デモ用 — 1 装置 · 3 ユニット · 複数モジュール */
export const DEMO_DEVICE: Device = {
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
