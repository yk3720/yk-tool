import { describe, expect, it } from "vitest";

import type { Device } from "./moduleHierarchy";
import { canDeleteDevice } from "./deviceDeletePermissions";

const owned: Pick<Device, "createdBy"> = { createdBy: "owner-uuid" };

describe("canDeleteDevice", () => {
  it("allows admin", () => {
    expect(canDeleteDevice("admin", "any", owned)).toBe(true);
    expect(canDeleteDevice("admin", "any", {})).toBe(true);
  });

  it("allows device owner", () => {
    expect(canDeleteDevice("editor", "owner-uuid", owned)).toBe(true);
  });

  it("denies other editors", () => {
    expect(canDeleteDevice("editor", "stranger", owned)).toBe(false);
  });

  it("denies viewer", () => {
    expect(canDeleteDevice("viewer", "owner-uuid", owned)).toBe(false);
  });

  it("denies editor when createdBy is absent", () => {
    expect(canDeleteDevice("editor", "anyone", {})).toBe(false);
  });
});
