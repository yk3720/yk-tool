import { afterEach, describe, expect, it, vi } from "vitest";

import { isPlaywrightActionStubEnabled } from "./e2eStub";

describe("isPlaywrightActionStubEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false on Vercel production even when flags are set", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("PLAYWRIGHT_E2E", "1");
    vi.stubEnv("MODULE_DELETE_E2E_STUB", "1");
    expect(isPlaywrightActionStubEnabled("MODULE_DELETE_E2E_STUB")).toBe(false);
  });

  it("returns true when flags are set and not Vercel production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PLAYWRIGHT_E2E", "1");
    vi.stubEnv("IMPORT_E2E_STUB", "1");
    expect(isPlaywrightActionStubEnabled("IMPORT_E2E_STUB")).toBe(true);
  });
});
