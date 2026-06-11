import { describe, expect, it } from "vitest";

import { isModuleContentDirty } from "./moduleContentDirty";

describe("isModuleContentDirty", () => {
  it("空モジュール（雛形のみ）は dirty でない", () => {
    expect(
      isModuleContentDirty({
        userTouched: false,
        committedJson: "",
        hasInitialSnapshot: false,
      })
    ).toBe(false);
  });

  it("再生成済みは dirty", () => {
    expect(
      isModuleContentDirty({
        userTouched: false,
        committedJson: "{}",
        hasInitialSnapshot: false,
      })
    ).toBe(true);
  });

  it("表編集のみでも dirty", () => {
    expect(
      isModuleContentDirty({
        userTouched: true,
        committedJson: "",
        hasInitialSnapshot: false,
      })
    ).toBe(true);
  });

  it("保存データ復元済みは dirty", () => {
    expect(
      isModuleContentDirty({
        userTouched: false,
        committedJson: "",
        hasInitialSnapshot: true,
      })
    ).toBe(true);
  });
});
