import { afterEach, describe, expect, it } from "vitest";

import { assertProductionSupabaseEnv, isAuthDisabled } from "./env";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("isAuthDisabled", () => {
  it("returns true only when AUTH_DISABLED=1", () => {
    process.env.AUTH_DISABLED = "1";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(isAuthDisabled()).toBe(true);
  });

  it("returns false when Supabase URL is missing but AUTH_DISABLED is not 1", () => {
    process.env.AUTH_DISABLED = "0";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(isAuthDisabled()).toBe(false);
  });
});

describe("assertProductionSupabaseEnv", () => {
  it("throws in production when Supabase env is missing", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_DISABLED = "0";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => assertProductionSupabaseEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/
    );
  });

  it("does not throw in production when AUTH_DISABLED=1", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_DISABLED = "1";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => assertProductionSupabaseEnv()).not.toThrow();
  });
});
