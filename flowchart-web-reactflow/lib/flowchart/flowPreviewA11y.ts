/** WCAG 2.2 — キャンバス要約 aria-label（要約 + 2.5.7 キーボード操作の説明） */
export function flowPreviewAriaLabel(
  nodeCount: number,
  edgeCount: number
): string {
  return `フローチャートプレビュー。ノード${nodeCount}個、接続${edgeCount}本。矢印キーで表示位置を移動、＋／－で拡大縮小。`;
}
