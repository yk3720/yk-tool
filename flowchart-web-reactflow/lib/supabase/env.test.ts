import { afterEach, describe, expect, it, vi } from "vitest";

import { assertProductionSupabaseEnv, isAuthDisabled } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAuthDisabled", () => {
  it("returns true only when AUTH_DISABLED=1", () => {
    vi.stubEnv("AUTH_DISABLED", "1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(isAuthDisabled()).toBe(true);
  });

  it("returns false when Supabase URL is missing but AUTH_DISABLED is not 1", () => {
    vi.stubEnv("AUTH_DISABLED", "0");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(isAuthDisabled()).toBe(false);
  });
});

describe("assertProductionSupabaseEnv", () => {
  it("throws in production when Supabase env is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DISABLED", "0");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => assertProductionSupabaseEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/
    );
  });

  it("does not throw in production when AUTH_DISABLED=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DISABLED", "1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() => assertProductionSupabaseEnv()).not.toThrow();
  });
});
