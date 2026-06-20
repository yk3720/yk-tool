import fs from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** WCAG 累積タグ — SSOT: A11Y_RULES.md No 24 · a11y.md */
export const WCAG_AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
] as const;

/** Phase 1: React Flow キャンバスは chrome スコープ外 */
export const AXE_EXCLUDE_SELECTORS = [".react-flow"] as const;

export type AxeGate = "warn" | "serious";

export const AXE_REPORT_PATH = path.join(
  process.cwd(),
  "test-results",
  "axe-report.json"
);

export function getAxeGate(): AxeGate {
  const raw = process.env.AXE_GATE ?? "warn";
  return raw === "serious" ? "serious" : "warn";
}

export async function analyzeA11y(
  page: Page,
  options?: { exclude?: readonly string[] }
) {
  let builder = new AxeBuilder({ page }).withTags([...WCAG_AXE_TAGS]);
  for (const sel of [...AXE_EXCLUDE_SELECTORS, ...(options?.exclude ?? [])]) {
    builder = builder.exclude(sel);
  }
  return builder.analyze();
}

export function writeAxeReport(
  results: Awaited<ReturnType<typeof analyzeA11y>>
): void {
  fs.mkdirSync(path.dirname(AXE_REPORT_PATH), { recursive: true });
  fs.writeFileSync(
    AXE_REPORT_PATH,
    JSON.stringify(
      {
        gate: getAxeGate(),
        violationCount: results.violations.length,
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.map((n) => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        })),
      },
      null,
      2
    )
  );
}

export function assertAxeGate(
  results: Awaited<ReturnType<typeof analyzeA11y>>
): void {
  const gate = getAxeGate();
  const { violations } = results;

  writeAxeReport(results);

  if (violations.length > 0) {
    console.warn(
      `[axe ${gate}] ${violations.length} violation(s):`,
      violations.map((v) => `${v.id} (${v.impact})`).join(", ")
    );
  }

  if (gate === "serious") {
    const serious = violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    if (serious.length > 0) {
      throw new Error(
        `axe serious/critical: ${serious.map((v) => v.id).join(", ")}`
      );
    }
  }
}

export type A11yBox = { x: number; y: number; width: number; height: number };

/** WCAG 2.4.11 Minimum — フォーカス対象が obscurer に完全に覆われていない */
export function isFullyObscuredBy(el: A11yBox, obscurer: A11yBox): boolean {
  const elBottom = el.y + el.height;
  const obBottom = obscurer.y + obscurer.height;
  return el.y >= obscurer.y && elBottom <= obBottom;
}
