import { describe, expect, it } from "vitest";

import type { Device, FlowUnit } from "./moduleHierarchy";
import { canDeleteModule } from "./moduleDeletePermissions";

const device: Pick<Device, "createdBy"> = { createdBy: "device-owner" };
const unit: Pick<FlowUnit, "createdBy"> = { createdBy: "unit-owner" };

describe("canDeleteModule", () => {
  it("allows admin", () => {
    expect(canDeleteModule("admin", "any", device, unit)).toBe(true);
  });

  it("allows device owner", () => {
    expect(canDeleteModule("editor", "device-owner", device, unit)).toBe(true);
  });

  it("allows unit owner", () => {
    expect(canDeleteModule("editor", "unit-owner", device, unit)).toBe(true);
  });

  it("denies other editors", () => {
    expect(canDeleteModule("editor", "stranger", device, unit)).toBe(false);
  });

  it("denies viewer", () => {
    expect(canDeleteModule("viewer", "unit-owner", device, unit)).toBe(false);
  });

  it("denies editor when createdBy is absent (legacy rows)", () => {
    expect(canDeleteModule("editor", "anyone", {}, {})).toBe(false);
  });

  it("allows admin when createdBy is absent", () => {
    expect(canDeleteModule("admin", "anyone", {}, {})).toBe(true);
  });
});
