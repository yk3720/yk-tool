"""テスト用 fixture（入力用 Excel）を生成する。"""

from __future__ import annotations

from pathlib import Path

from excel_normalize.workbook_builder import build_workbook

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"


def main() -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    out = FIXTURES / "input-device-z00001.xlsx"
    build_workbook(include_usage_sheet=False).save(out)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
