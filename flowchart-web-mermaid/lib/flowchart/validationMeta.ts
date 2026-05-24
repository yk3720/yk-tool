import { parseTable } from "./parseTable";
import type { FlowTableRow } from "./types";

/** エラーメッセージから表の行インデックス（0-based）を抽出 */
export function errorRowIndices(
  errors: string[],
  table: FlowTableRow[],
): Set<number> {
  const rows = new Set<number>();

  for (const err of errors) {
    const lineMatch = err.match(/行\s*(\d+)/);
    if (lineMatch) {
      const ri = parseInt(lineMatch[1], 10) - 1;
      if (ri >= 0) rows.add(ri);
    }

    const idMatch = err.match(/ID\s+([\d.]+)/);
    if (idMatch) {
      const targetId = idMatch[1].split(".")[0];
      table.forEach((row, i) => {
        const cell = row[0];
        if (cell !== null && cell !== undefined && String(cell) === targetId) {
          rows.add(i);
        }
      });
    }
  }

  return rows;
}

/** エラーに加え警告（生成は可能なもの） */
export function validateTableWarnings(table: FlowTableRow[]): string[] {
  const warnings: string[] = [];
  const { nodes } = parseTable(table);

  if (nodes.length === 0) {
    warnings.push("有効なノードがありません（ID 列を確認してください）");
    return warnings;
  }

  for (const n of nodes) {
    if (n.type === "判断") {
      if (n.destsDown.length === 0 && n.destsRight.length === 0) {
        warnings.push(
          `ID ${n.id}（判断）: 下または右の接続先がありません`,
        );
      }
      if (n.destsDown.length > 1) {
        warnings.push(
          `ID ${n.id}（判断）: 下方向の接続先は 1 件が望ましいです`,
        );
      }
    }
  }

  const posKey = (n: (typeof nodes)[0]) => `${n.rowIndex}:${n.level}`;
  const seen = new Map<string, string>();
  for (const n of nodes) {
    const k = posKey(n);
    if (seen.has(k)) {
      warnings.push(
        `ID ${n.id} と ID ${seen.get(k)}: 同じ行・Level で重なります`,
      );
    } else {
      seen.set(k, n.id);
    }
  }

  return warnings;
}
