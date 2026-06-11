import { afterEach, describe, expect, it, vi } from "vitest";

import type { Device, FlowModule } from "./moduleHierarchy";
import type { ModuleSnapshot } from "./moduleDraftRepository";

const store = new Map<string, ModuleSnapshot>();

vi.mock("@/lib/flowchart/actions/flowDocuments", () => ({
  loadFlowDocument: vi.fn(),
}));

vi.mock("@/lib/flowchart/offlineFlowCache", () => ({
  getOfflineModuleCache: vi.fn().mockResolvedValue(null),
  putOfflineModuleCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase/env", () => ({
  isAuthDisabled: () => true,
}));

vi.mock("./moduleDraftRepository", () => ({
  moduleDraftRepository: {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, snapshot: ModuleSnapshot) => {
      store.set(key, snapshot);
    },
  },
}));

import { loadModuleDraft } from "./moduleDraftLoader";

const testModule: FlowModule = {
  id: "c0000001-0001-4001-8001-000000000101",
  label: "供給動作",
  legacyKey: "supply-feed",
};

const device: Device = {
  id: "a0000001-0001-4001-8001-000000000001",
  name: "プレス A",
  internalCode: "DEMO-001",
  units: [],
};

describe("loadModuleDraft isCancelled", () => {
  afterEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it("isCancelled が false なら local の snapshot を返す", async () => {
    store.set(testModule.id, {
      jsonText: '{"title":"saved"}',
      committedJson: "",
      nodes: [],
      edges: [],
    });

    const result = await loadModuleDraft(testModule, device, {
      isCancelled: () => false,
    });

    expect(result.source).toBe("local");
    expect(result.snapshot?.jsonText).toContain("saved");
  });

  it("isCancelled が true なら snapshot を適用しない", async () => {
    store.set(testModule.id, {
      jsonText: '{"title":"stale"}',
      committedJson: "",
      nodes: [],
      edges: [],
    });

    const result = await loadModuleDraft(testModule, device, {
      isCancelled: () => true,
    });

    expect(result).toEqual({ snapshot: null, source: "none" });
  });
});
