import { parseTable } from "./parseTable";
import type { FlowTableRow } from "./types";

export function validateTable(table: FlowTableRow[]): string[] {
  const errors: string[] = [];
  if (!table.length) {
    errors.push("表が空です");
    return errors;
  }

  const colCount = table[0]?.length ?? 0;
  if (colCount < 6) {
    errors.push(`列数が不足しています（${colCount}列）。6列以上が必要です`);
  }

  for (let i = 0; i < table.length; i++) {
    const len = table[i]?.length ?? 0;
    if (len !== colCount) {
      errors.push(
        `行 ${i + 1}: 列数が先頭行（${colCount}）と一致しません（${len}列）`
      );
    }
  }

  const { nodes } = parseTable(table);
  if (nodes.length === 0) {
    errors.push("有効なノードが 1 件もありません（ID 列を確認してください）");
    return errors;
  }

  const idSet = new Set<string>();
  for (const n of nodes) {
    if (idSet.has(n.id)) {
      errors.push(`ID ${n.id} が重複しています`);
    }
    idSet.add(n.id);
  }

  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    for (const did of [...n.destsDown, ...n.destsRight]) {
      if (!ids.has(did)) {
        errors.push(`ID ${n.id}: 接続先 ${did} が見つかりません`);
      }
    }
  }

  return errors;
}
