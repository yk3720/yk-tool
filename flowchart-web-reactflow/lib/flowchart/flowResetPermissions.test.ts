import { describe, expect, it } from "vitest";

import { canResetFlowContent } from "./flowResetPermissions";

describe("canResetFlowContent", () => {
  const owned = { hasFlow: true, createdBy: "owner-uuid" };

  it("allows admin when flow exists", () => {
    expect(canResetFlowContent("admin", "any", owned)).toBe(true);
    expect(canResetFlowContent("admin", "any", { hasFlow: true })).toBe(true);
  });

  it("allows flow creator", () => {
    expect(canResetFlowContent("editor", "owner-uuid", owned)).toBe(true);
  });

  it("denies other editors", () => {
    expect(canResetFlowContent("editor", "stranger", owned)).toBe(false);
  });

  it("denies viewer", () => {
    expect(canResetFlowContent("viewer", "owner-uuid", owned)).toBe(false);
  });

  it("denies when flow row is absent", () => {
    expect(canResetFlowContent("admin", "any", { hasFlow: false })).toBe(false);
  });

  it("denies editor when createdBy is absent (legacy rows)", () => {
    expect(canResetFlowContent("editor", "anyone", { hasFlow: true })).toBe(
      false
    );
  });
});
