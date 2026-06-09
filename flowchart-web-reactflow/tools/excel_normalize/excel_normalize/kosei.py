from __future__ import annotations

from dataclasses import dataclass

from openpyxl import Workbook

from .constants import KOSEI_HEADERS, KOSEI_SHEET


@dataclass(frozen=True)
class KoseiRow:
    internal_code: str
    display_name: str
    unit_label: str
    module_label: str
    sort_index: int


@dataclass
class KoseiSheet:
    rows: list[KoseiRow]
    display_name: str
    internal_code: str

    @property
    def unit_labels(self) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for row in self.rows:
            if row.unit_label not in seen:
                seen.add(row.unit_label)
                out.append(row.unit_label)
        return out

    def modules_for_unit(self, unit_label: str) -> list[str]:
        return [r.module_label for r in self.rows if r.unit_label == unit_label]


def _cell_str(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def parse_kosei_sheet(workbook: Workbook) -> KoseiSheet:
    if KOSEI_SHEET not in workbook.sheetnames:
        raise ValueError(f"シート「{KOSEI_SHEET}」がありません")

    ws = workbook[KOSEI_SHEET]
    matrix: list[list[str]] = []
    for row in ws.iter_rows(values_only=True):
        matrix.append([_cell_str(v) for v in row])

    if not matrix:
        raise ValueError(f"シート「{KOSEI_SHEET}」が空です")

    header = tuple(matrix[0][:4])
    if header != KOSEI_HEADERS:
        raise ValueError(
            f"シート「{KOSEI_SHEET}」1行目は {KOSEI_HEADERS} である必要があります（実際: {header}）"
        )

    rows: list[KoseiRow] = []
    codes: set[str] = set()
    display_names: set[str] = set()

    for idx, raw in enumerate(matrix[1:], start=0):
        cells = (raw + ["", "", "", ""])[:4]
        if not any(cells):
            continue
        internal_code, display_name, unit_label, module_label = cells
        if not all([internal_code, display_name, unit_label, module_label]):
            raise ValueError(
                f"シート「{KOSEI_SHEET}」{idx + 2}行目: 4列すべて入力してください"
            )
        codes.add(internal_code)
        display_names.add(display_name)
        rows.append(
            KoseiRow(
                internal_code=internal_code,
                display_name=display_name,
                unit_label=unit_label,
                module_label=module_label,
                sort_index=idx,
            )
        )

    if not rows:
        raise ValueError(f"シート「{KOSEI_SHEET}」にデータ行がありません")

    if len(codes) != 1:
        raise ValueError(
            f"装置製番（社内番号）がファイル内で一意ではありません: {sorted(codes)}"
        )
    if len(display_names) != 1:
        raise ValueError(
            f"装置名がファイル内で一意ではありません: {sorted(display_names)}"
        )

    return KoseiSheet(
        rows=rows,
        internal_code=rows[0].internal_code,
        display_name=rows[0].display_name,
    )
