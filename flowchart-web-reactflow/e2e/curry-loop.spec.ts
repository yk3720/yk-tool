import { expect, test } from "@playwright/test";

import { openPreviewWithSample } from "./helpers/flowchart";

test.describe("カレーサンプル — ループと図形", () => {
  test.beforeEach(async ({ page }) => {
    await openPreviewWithSample(page, "例を見る: カレーの作り方");
  });

  test("生成完了: 15 ノード · ループ用の右列ステップを含む", async ({
    page,
  }) => {
    await expect(page.getByText(/生成完了 — ノード 15/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("あと5分炒める")).toBeVisible();
    await expect(page.getByText("もう少し煮込む")).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(15);
  });

  test("No ラベルが 3 件 · 判断菱形が 3 つ", async ({ page }) => {
    await expect(page.locator(".flow-node-diamond")).toHaveCount(3);
    await expect(page.locator('[data-edge-label-text="No"]')).toHaveCount(3);
    await expect(page.locator('[data-edge-label-text="Yes"]')).toHaveCount(3);
  });

  test("プレビュー各ノードに表 ID バッジが表示される", async ({ page }) => {
    await expect(page.locator('[data-testid="flow-node-id"]')).toHaveCount(15);
    const decision = page
      .locator(".react-flow__node")
      .filter({ hasText: "玉ねぎは透明?" });
    await expect(decision.locator('[data-testid="flow-node-id"]')).toHaveText(
      "50"
    );
  });

  test("入出力・手動入力は SVG polygon で枠が閉じている", async ({ page }) => {
    const parallelogram = page.locator(".flow-node-parallelogram polygon");
    const manual = page.locator(".flow-node-manual polygon");
    await expect(parallelogram).toHaveCount(1);
    await expect(manual).toHaveCount(1);
    await expect(parallelogram).toHaveAttribute("stroke", "#1a1a1a");
    await expect(manual).toHaveAttribute("stroke", "#1a1a1a");
  });

  test("No 分岐から上方向へ戻るエッジが描画される", async ({ page }) => {
    await expect(async () => {
      const result = await page.evaluate(() => {
        const nodes = Array.from(
          document.querySelectorAll(".react-flow__node")
        );
        const byText = (snippet: string) =>
          nodes.find((n) => n.textContent?.includes(snippet));
        const retryOnion = byText("あと5分炒める");
        const retryBoil = byText("もう少し煮込む");
        const sauté = byText("野菜と肉を炒める");
        const simmer = byText("加水して煮込む");
        if (!retryOnion || !retryBoil || !sauté || !simmer) {
          return { ok: false as const, reason: "missing-node" };
        }

        const centerY = (el: Element) => {
          const b = el.getBoundingClientRect();
          return (b.top + b.bottom) / 2;
        };

        const paths = Array.from(
          document.querySelectorAll(
            ".react-flow__edge path.react-flow__edge-path"
          )
        );

        const hasUpwardFrom = (from: Element, to: Element) => {
          const fy = centerY(from);
          const ty = centerY(to);
          if (fy <= ty) return false;
          const fb = from.getBoundingClientRect();
          for (const path of paths) {
            const pb = path.getBoundingClientRect();
            const nearFrom =
              Math.abs(pb.top - fb.bottom) < 80 ||
              Math.abs(pb.bottom - fb.bottom) < 80;
            const spansUp = pb.top < fy && pb.bottom < fy && pb.top <= ty + 40;
            if (nearFrom && spansUp) return true;
          }
          return false;
        };

        const onionLoop = hasUpwardFrom(retryOnion, sauté);
        const boilLoop = hasUpwardFrom(retryBoil, simmer);
        if (!onionLoop || !boilLoop) {
          return {
            ok: false as const,
            reason: "no-upward-edge",
            onionLoop,
            boilLoop,
          };
        }
        return { ok: true as const };
      });
      expect(result.ok, JSON.stringify(result)).toBe(true);
    }).toPass({ timeout: 10_000 });
  });
});
