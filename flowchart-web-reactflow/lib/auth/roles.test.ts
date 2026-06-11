import { describe, expect, it } from "vitest";

import {
  canEditFlowchart,
  getRoleLabel,
  isAdminRole,
  isAppRole,
} from "./roles";

describe("roles SSOT (M-3)", () => {
  it("isAppRole accepts editor, viewer, admin", () => {
    expect(isAppRole("editor")).toBe(true);
    expect(isAppRole("viewer")).toBe(true);
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole("superuser")).toBe(false);
  });

  it("isAdminRole is true only for admin", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("editor")).toBe(false);
    expect(isAdminRole("viewer")).toBe(false);
  });

  it("canEditFlowchart includes editor and admin", () => {
    expect(canEditFlowchart("editor")).toBe(true);
    expect(canEditFlowchart("admin")).toBe(true);
    expect(canEditFlowchart("viewer")).toBe(false);
  });

  it("getRoleLabel returns Japanese labels", () => {
    expect(getRoleLabel("admin")).toBe("管理者");
    expect(getRoleLabel("editor")).toBe("編集者");
    expect(getRoleLabel("viewer")).toBe("閲覧者");
  });
});
