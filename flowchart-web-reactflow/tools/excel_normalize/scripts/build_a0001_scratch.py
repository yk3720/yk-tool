"""A0001 塗布装置 — 1 動作試行用 _scratch/{動作名}.xlsx を生成する。"""

from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook

from excel_normalize.constants import FLOW_HEADERS

ROOT = Path(__file__).resolve().parents[1]
DEVICE_DIR = ROOT / "fixtures" / "devices" / "A0001_塗布装置"
SCRATCH_DIR = DEVICE_DIR / "_scratch"

# import.json「供給ユニット / 取出」と同一（table-10col-v1）
TORIDASHI_ROWS: list[list[str]] = [
    ["10", "端子", "20", "", "1", "0", "開始", "", "", ""],
    ["20", "処理", "30", "", "2", "0", "ワーク取出", "", "", ""],
    ["30", "端子", "", "", "3", "0", "終了", "", "", ""],
]


def build_toridashi_scratch() -> Workbook:
    wb = Workbook()
    ws = wb.active
    ws.title = "表"
    ws.append(list(FLOW_HEADERS))
    for row in TORIDASHI_ROWS:
        ws.append(row)
    return wb


def main() -> None:
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    out = SCRATCH_DIR / "取出.xlsx"
    build_toridashi_scratch().save(out)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
