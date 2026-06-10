"""作者向け入力用 Excel テンプレ v0.1 を生成する。"""

from __future__ import annotations

from pathlib import Path

from excel_normalize.workbook_builder import build_workbook

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"


def main() -> None:
    TEMPLATES.mkdir(parents=True, exist_ok=True)
    out = TEMPLATES / "入力用テンプレ_v0.1.xlsx"
    build_workbook(include_usage_sheet=True).save(out)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
