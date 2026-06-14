"""作者向け入力用 Excel テンプレ v0.2 を生成する（供給 + 加工 · 各 2 動作）。"""

from __future__ import annotations

from pathlib import Path

from excel_normalize.device_workbook import (
    DEFAULT_DEVICE_TEMPLATE,
    build_device_workbook,
)

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"


def main() -> None:
    TEMPLATES.mkdir(parents=True, exist_ok=True)
    out = TEMPLATES / "入力用テンプレ_v0.2.xlsx"
    build_device_workbook(
        DEFAULT_DEVICE_TEMPLATE,
        include_usage_sheet=True,
    ).save(out)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
