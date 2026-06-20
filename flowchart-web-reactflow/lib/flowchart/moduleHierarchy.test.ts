import { describe, expect, it } from "vitest";
import {
  DEMO_DEVICE_PRESS_A,
  DEMO_DEVICE_PRESS_B,
  excludeModulesFromDevices,
  formatDeviceSelectLabel,
  hasModuleInDevices,
  moduleStorageKey,
  resolveModuleDraftKeys,
} from "./moduleHierarchy";

describe("moduleHierarchy", () => {
  it("moduleStorageKey returns module uuid", () => {
    const uuid = "c0000001-0001-4001-8001-000000001001";
    expect(moduleStorageKey(uuid)).toBe(uuid);
  });

  it("formatDeviceSelectLabel prefixes internal code", () => {
    expect(
      formatDeviceSelectLabel({ name: "塗布装置", internalCode: "A0001" })
    ).toBe("A0001：塗布装置");
    expect(formatDeviceSelectLabel({ name: "装置のみ" })).toBe("装置のみ");
  });

  it("resolveModuleDraftKeys includes uuid and legacy keys for DEMO-001", () => {
    const mod = DEMO_DEVICE_PRESS_A.units[0]!.modules[0]!;
    const keys = resolveModuleDraftKeys(mod, DEMO_DEVICE_PRESS_A);
    expect(keys[0]).toBe(mod.id);
    expect(keys).toContain("DEMO-001:supply-feed");
    expect(keys).toContain("press-01:supply-feed");
    expect(keys).toContain("supply-feed");
  });

  it("resolveModuleDraftKeys has no bare slug fallback for DEMO-002", () => {
    const mod = DEMO_DEVICE_PRESS_B.units[0]!.modules[0]!;
    const keys = resolveModuleDraftKeys(mod, DEMO_DEVICE_PRESS_B);
    expect(keys).toContain("DEMO-002:b-supply-feed");
    expect(keys).toContain("press-02:b-supply-feed");
    expect(keys).not.toContain("b-supply-feed");
  });

  it("DEMO_DEVICE_PRESS_A has expected module count", () => {
    const count = DEMO_DEVICE_PRESS_A.units.reduce(
      (n, u) => n + u.modules.length,
      0
    );
    expect(count).toBe(5);
  });

  it("excludeModulesFromDevices removes module from nav tree", () => {
    const removedId = DEMO_DEVICE_PRESS_A.units[0]!.modules[0]!.id;
    const filtered = excludeModulesFromDevices(
      [DEMO_DEVICE_PRESS_A],
      new Set([removedId])
    );
    expect(hasModuleInDevices(filtered, removedId)).toBe(false);
    expect(filtered[0]!.units[0]!.modules).toHaveLength(1);
  });
});
