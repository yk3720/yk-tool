import { describe, expect, it } from "vitest";
import {
  DEMO_DEVICE_PRESS_A,
  moduleDraftKey,
  resolveModuleDraftKey,
} from "./moduleHierarchy";

describe("moduleHierarchy", () => {
  it("moduleDraftKey combines device and module", () => {
    expect(moduleDraftKey("press-01", "supply-feed")).toBe(
      "press-01:supply-feed",
    );
  });

  it("resolveModuleDraftKey falls back for press-01 legacy ids", () => {
    expect(resolveModuleDraftKey("press-01", "supply-feed")).toEqual([
      "press-01:supply-feed",
      "supply-feed",
    ]);
  });

  it("resolveModuleDraftKey has no legacy fallback for other devices", () => {
    expect(resolveModuleDraftKey("press-02", "b-supply-feed")).toEqual([
      "press-02:b-supply-feed",
    ]);
  });

  it("DEMO_DEVICE_PRESS_A has expected module count", () => {
    const count = DEMO_DEVICE_PRESS_A.units.reduce(
      (n, u) => n + u.modules.length,
      0,
    );
    expect(count).toBe(5);
  });
});
