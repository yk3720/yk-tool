import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseFlowchartDocument } from "./document";

const SAMPLE_CURRY = join(process.cwd(), "fixtures/sample-curry.json");

describe("parseFlowchartDocument", () => {
  it("parses a valid fixture document", () => {
    const raw = readFileSync(SAMPLE_CURRY, "utf-8");
    const { doc, errors } = parseFlowchartDocument(raw);

    expect(errors).toEqual([]);
    expect(doc?.version).toBe(1);
    expect(doc?.table.length).toBeGreaterThan(0);
  });

  it("rejects invalid payload with clear errors", () => {
    const { doc, errors } = parseFlowchartDocument(
      JSON.stringify({ version: 2, table: "not-an-array" })
    );

    expect(doc).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(" · ")).toMatch(/version|table/i);
  });
});
