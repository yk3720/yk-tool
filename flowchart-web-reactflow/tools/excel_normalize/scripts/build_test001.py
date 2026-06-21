"""試走用 TEST-001（1 装置 · 2 ユニット）の装置 xlsx を生成する。"""

from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook

from excel_normalize.constants import KOSEI_HEADERS, KOSEI_SHEET
from excel_normalize.device_paths import device_workbook_path
from excel_normalize.workbook_builder import _add_flow_table

ROOT = Path(__file__).resolve().parents[1]
DEVICE_DIR = ROOT / "fixtures" / "devices" / "TEST-001_試験装置"

INTERNAL_CODE = "TEST-001"
DISPLAY_NAME = "試験装置"

KOSEI_ROWS = [
    (INTERNAL_CODE, DISPLAY_NAME, "試験ユニット", "試験動作"),
    (INTERNAL_CODE, DISPLAY_NAME, "検証ユニット", "確認動作"),
]

FLOW_BY_MODULE: dict[str, list[list[str]]] = {
    "試験動作": [
        ["10", "端子", "20", "", "1", "0", "開始", "", "", ""],
        ["20", "処理", "30", "", "2", "0", "試験処理", "", "", ""],
        ["30", "端子", "", "", "3", "0", "終了", "", "", ""],
    ],
    "確認動作": [
        ["10", "端子", "20", "", "1", "0", "開始", "", "", ""],
        ["20", "処理", "30", "", "2", "0", "確認処理", "", "", ""],
        ["30", "端子", "", "", "3", "0", "終了", "", "", ""],
    ],
}

UNIT_SHEETS: dict[str, list[tuple[str, str]]] = {
    "試験ユニット": [("試験_試験動作", "試験動作")],
    "検証ユニット": [("検証_確認動作", "確認動作")],
}


def build_test001_workbook() -> Workbook:
    wb = Workbook()
    ws_kosei = wb.active
    ws_kosei.title = KOSEI_SHEET
    ws_kosei.append(list(KOSEI_HEADERS))
    for row in KOSEI_ROWS:
        ws_kosei.append(list(row))

    for unit_label, tables in UNIT_SHEETS.items():
        ws_unit = wb.create_sheet(unit_label)
        start_col = 1
        for table_name, module_label in tables:
            _add_flow_table(
                ws_unit,
                table_name=table_name,
                start_col=start_col,
                start_row=1,
                data_rows=FLOW_BY_MODULE[module_label],
            )
            start_col += 13

    return wb


def main() -> None:
    DEVICE_DIR.mkdir(parents=True, exist_ok=True)
    (DEVICE_DIR / "archive").mkdir(exist_ok=True)
    master_xlsx = device_workbook_path(DEVICE_DIR)
    build_test001_workbook().save(master_xlsx)
    print(f"Wrote {master_xlsx}")


if __name__ == "__main__":
    main()
