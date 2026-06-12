import { describe, expect, it } from "vitest";

import type { Device, FlowUnit } from "./moduleHierarchy";
import { canDeleteUnit } from "./unitDeletePermissions";

const device: Pick<Device, "createdBy"> = { createdBy: "device-owner" };
const unit: Pick<FlowUnit, "createdBy"> = { createdBy: "unit-owner" };

describe("canDeleteUnit", () => {
  it("allows admin", () => {
    expect(canDeleteUnit("admin", "any", device, unit)).toBe(true);
  });

  it("allows device owner", () => {
    expect(canDeleteUnit("editor", "device-owner", device, unit)).toBe(true);
  });

  it("allows unit owner", () => {
    expect(canDeleteUnit("editor", "unit-owner", device, unit)).toBe(true);
  });

  it("denies other editors", () => {
    expect(canDeleteUnit("editor", "stranger", device, unit)).toBe(false);
  });

  it("denies viewer", () => {
    expect(canDeleteUnit("viewer", "unit-owner", device, unit)).toBe(false);
  });

  it("denies editor when createdBy is absent (legacy rows)", () => {
    expect(canDeleteUnit("editor", "anyone", {}, {})).toBe(false);
  });

  it("allows admin when createdBy is absent", () => {
    expect(canDeleteUnit("admin", "anyone", {}, {})).toBe(true);
  });
});
