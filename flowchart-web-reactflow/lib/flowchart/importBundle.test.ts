import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  importBundleSchema,
  parseImportBundleJson,
} from "./importBundleSchema";
import { prepareImportBundleForRpc } from "./prepareImportBundle";

const FIXTURE_JSON = join(
  process.cwd(),
  "tools/excel_normalize/fixtures/import-z00001.json"
);

describe("importBundleSchema", () => {
  it("parses fixture import.json", () => {
    const raw = readFileSync(FIXTURE_JSON, "utf-8");
    const parsed = parseImportBundleJson(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.bundle.internal_code).toBe("Z00001");
    expect(parsed.bundle.flows).toHaveLength(4);
  });

  it("prepareImportBundleForRpc builds ModuleSnapshot payloads", () => {
    const raw = readFileSync(FIXTURE_JSON, "utf-8");
    const parsed = parseImportBundleJson(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const prepared = prepareImportBundleForRpc(parsed.bundle);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;

    expect(prepared.bundle.flows[0]?.payload.jsonText).toContain('"table"');
    expect(prepared.bundle.flows[0]?.payload.nodes.length).toBeGreaterThan(0);
    expect(prepared.bundle.flows[0]?.payload.edges.length).toBeGreaterThan(0);
  });

  it("rejects invalid bundle shape", () => {
    const result = importBundleSchema.safeParse({ internal_code: "X" });
    expect(result.success).toBe(false);
  });

  it("rejects oversized json text", () => {
    const huge = " ".repeat(5 * 1024 * 1024 + 1);
    const parsed = parseImportBundleJson(huge);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toMatch(/大きすぎます/);
    }
  });
});
