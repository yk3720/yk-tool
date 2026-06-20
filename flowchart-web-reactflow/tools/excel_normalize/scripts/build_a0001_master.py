"""A0001 塗布装置 — マスター.xlsx 生成 + import.json 正規化。"""

from __future__ import annotations

import json
from pathlib import Path

from excel_normalize.device_workbook import (
    DeviceSpec,
    ModuleSpec,
    UnitSpec,
    build_device_workbook,
)
from excel_normalize.normalize import normalize_workbook

ROOT = Path(__file__).resolve().parents[1]
DEVICE_DIR = ROOT / "fixtures" / "devices" / "A0001_塗布装置"
MASTER_XLSX = DEVICE_DIR / "マスター.xlsx"
IMPORT_JSON = DEVICE_DIR / "import.json"

A0001_SPEC = DeviceSpec(
    "A0001",
    "塗布装置",
    (
        UnitSpec(
            "供給ユニット",
            (ModuleSpec("取出", "ワーク取出"), ModuleSpec("供給")),
        ),
        UnitSpec(
            "加工ユニット",
            (ModuleSpec("プレス"), ModuleSpec("離脱")),
        ),
    ),
)


def main() -> None:
    DEVICE_DIR.mkdir(parents=True, exist_ok=True)
    (DEVICE_DIR / "archive").mkdir(exist_ok=True)

    build_device_workbook(A0001_SPEC).save(MASTER_XLSX)
    bundle = normalize_workbook(MASTER_XLSX).bundle
    IMPORT_JSON.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    flow_count = len(bundle["flows"])
    print(f"Wrote {MASTER_XLSX} -> {IMPORT_JSON} ({flow_count} flows)")


if __name__ == "__main__":
    main()
