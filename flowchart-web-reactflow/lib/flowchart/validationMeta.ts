import { parseTable } from "./parseTable";
import { normalizeColorHint } from "./flowColors";
import type { FlowTableRow } from "./types";

/** エラーメッセージから表の行インデックス（0-based）を抽出 */
export function errorRowIndices(
  errors: string[],
  table: FlowTableRow[]
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

/** 警告バナー上部の説明（生成は継続する旨） */
export const WARNING_BANNER_HINT =
  "図はこのまま生成されます。行をクリックすると表の該当箇所へ移動します。";

/** エラーに加え警告（生成は可能なもの） */
export function validateTableWarnings(table: FlowTableRow[]): string[] {
  const warnings: string[] = [];
  const { nodes, colCount } = parseTable(table);

  if (nodes.length === 0) {
    warnings.push(
      "ID 列が空です — 各行の ID に番号（10, 20…）を入れてください"
    );
    return warnings;
  }

  for (const n of nodes) {
    if (n.type === "判断") {
      if (n.destsDown.length === 0 && n.destsRight.length === 0) {
        warnings.push(
          `ID ${n.id}（判断）: 接続先(下) か 接続先(右) を入れてください — Yes/No の分岐用です`
        );
      }
      if (n.destsDown.length > 1) {
        warnings.push(
          `ID ${n.id}（判断）: 接続先(下) は1件にしてください — 複数あると図が分かりにくいです（Yes は下・No は右が一般的です）`
        );
      }
    }
  }

  if (colCount >= 10) {
    for (const n of nodes) {
      const cell = table[n.rowIndex]?.[9];
      const { unknown } = normalizeColorHint(cell);
      if (unknown) {
        warnings.push(
          `ID ${n.id}: 色列の値「${String(cell).trim()}」は未対応です — 空・黄・橙・青のいずれかにしてください（通常として描画します）`
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
        `ID ${n.id} と ID ${seen.get(k)}: 同じ行・Level のため図上で重なります — Level または行をずらしてください`
      );
    } else {
      seen.set(k, n.id);
    }
  }

  return warnings;
}
