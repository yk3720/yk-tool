import { describe, expect, it } from "vitest";

import { isModuleUuid } from "./moduleUuid";

describe("moduleUuid", () => {
  it("accepts lowercase uuid", () => {
    expect(isModuleUuid("c0000001-0001-4001-8001-000000001001")).toBe(true);
  });

  it("rejects legacy text keys", () => {
    expect(isModuleUuid("press-01:supply-feed")).toBe(false);
    expect(isModuleUuid("DEMO-001:supply-feed")).toBe(false);
  });
});
