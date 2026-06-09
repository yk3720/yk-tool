import { describe, expect, it } from "vitest";
import {
  branchFromEdgeLabel,
  placementForEdgeLabel,
} from "./edgeLabelPlacement";

describe("branchFromEdgeLabel", () => {
  it("maps Yes/No only", () => {
    expect(branchFromEdgeLabel("Yes")).toBe("yes");
    expect(branchFromEdgeLabel("No")).toBe("no");
    expect(branchFromEdgeLabel(undefined)).toBeUndefined();
  });
});

describe("placementForEdgeLabel", () => {
  it("places Yes beside vertical segment with halo variant", () => {
    const p = placementForEdgeLabel(
      100,
      200,
      "yes",
      "down",
      100,
      100,
      100,
      300
    );
    expect(p.variant).toBe("halo");
    expect(p.transform).toContain("translate(0%, -50%)");
    expect(p.x).toBeGreaterThan(100);
    expect(p.y).toBeGreaterThan(100);
  });

  it("places No beside elbow vertical leg with halo variant", () => {
    const p = placementForEdgeLabel(
      150,
      250,
      "no",
      "right",
      100,
      100,
      180,
      300
    );
    expect(p.variant).toBe("halo");
    expect(p.x).toBeGreaterThanOrEqual(150);
  });

  it("keeps generic labels centered with pill variant", () => {
    const p = placementForEdgeLabel(
      50,
      60,
      undefined,
      undefined,
      0,
      0,
      100,
      100
    );
    expect(p.variant).toBe("pill");
    expect(p.transform).toContain("translate(-50%, -50%)");
  });
});
