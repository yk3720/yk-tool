import { expect, test, type Page } from "@playwright/test";

import {
  ensureNavExpanded,
  ensureWorkspaceLoaded,
  loadSampleFromMenu,
  openPreviewWithSample,
} from "./helpers/flowchart";

async function assertBranchLabelHalo(
  page: Page,
  branch: "yes" | "no",
  index = 0
) {
  const label = page.locator(`[data-edge-label-branch="${branch}"]`).nth(index);
  await expect(label).toBeVisible();
  await expect(label).toHaveClass(/bg-transparent/);
  await expect(page.locator(".react-flow__edge-text")).toHaveCount(0);
}

/** 分岐ラベルが近傍の縦エッジの右側にあり、DOM 上で交差しない */
async function assertLabelRightOfVerticalEdge(
  page: Page,
  branch: "yes" | "no"
) {
  await expect(async () => {
    const result = await page.evaluate((b) => {
      const label = document.querySelector(`[data-edge-label-branch="${b}"]`);
      if (!label) {
        return { ok: false as const, reason: `no-${b}-label` };
      }
      const lb = label.getBoundingClientRect();
      const paths = Array.from(
        document.querySelectorAll(
          ".react-flow__edge path.react-flow__edge-path"
        )
      );

      let matchedVertical = false;
      for (const path of paths) {
        const pb = path.getBoundingClientRect();
        const isVertical = pb.height > pb.width * 3 && pb.width < 14;
        if (!isVertical) continue;

        const yOverlap = lb.bottom > pb.top + 2 && lb.top < pb.bottom - 2;
        if (!yOverlap) continue;

        matchedVertical = true;
        const minGapPx = 2;
        if (lb.left < pb.right + minGapPx) {
          return {
            ok: false as const,
            reason: `${b}-left-of-vertical-gap`,
            labelLeft: lb.left,
            pathRight: pb.right,
          };
        }

        const intersects =
          lb.left < pb.right &&
          lb.right > pb.left &&
          lb.top < pb.bottom &&
          lb.bottom > pb.top;
        if (intersects) {
          return {
            ok: false as const,
            reason: "bbox-intersects-vertical-edge",
          };
        }
      }

      if (!matchedVertical) {
        return {
          ok: false as const,
          reason: `no-vertical-edge-aligned-with-${b}`,
        };
      }
      return { ok: true as const };
    }, branch);

    expect(result.ok, JSON.stringify(result)).toBe(true);
  }).toPass({ timeout: 10_000 });
}

test.describe("分岐ラベル配置（Yes と縦線）", () => {
  test("サンプルカレー: Yes / No が halo で縦線と重ならない", async ({
    page,
  }) => {
    await openPreviewWithSample(page);
    await expect(page.locator('[data-edge-label-text="Yes"]')).toHaveCount(3);
    await expect(page.locator('[data-edge-label-text="No"]')).toHaveCount(3);
    await expect(page.locator(".flow-node-diamond")).toHaveCount(3, {
      timeout: 15_000,
    });

    await assertBranchLabelHalo(page, "yes");
    await assertBranchLabelHalo(page, "no");
    await assertLabelRightOfVerticalEdge(page, "yes");
  });

  test("モジュール選択中: サンプル読込後も Yes / No が halo", async ({
    page,
  }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    await loadSampleFromMenu(page, "例を見る: カレーの作り方");
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-edge-label-text="Yes"]')).toHaveCount(3);
    await expect(page.locator('[data-edge-label-text="No"]')).toHaveCount(3);

    await assertBranchLabelHalo(page, "yes");
    await assertBranchLabelHalo(page, "no");
  });

  test("モジュール選択中: サンプル読込後に遅延 loadModule で巻き戻らない", async ({
    page,
  }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    await loadSampleFromMenu(page, "例を見る: カレーの作り方");
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    const curryCell = page.getByText("レシピを確認");
    await expect(curryCell).toBeVisible();

    await expect(async () => {
      await expect(curryCell).toBeVisible();
      await expect(page.getByText("ここに処理名")).toHaveCount(0);
    }).toPass({ timeout: 5_000 });
  });
});
