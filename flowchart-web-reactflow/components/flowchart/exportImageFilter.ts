/** PNG/SVG エクスポート時に DOM から除外する要素（プレビュー専用 UI） */
export function shouldIncludeInFlowExport(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return true;
  if (node.classList.contains("react-flow__controls")) return false;
  if (node.classList.contains("flow-node-id")) return false;
  return true;
}
