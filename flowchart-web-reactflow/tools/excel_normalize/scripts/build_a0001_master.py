"""A0001 塗布装置 — v0.3 xlsx 生成 + import.json 正規化。"""

from __future__ import annotations

import json
from pathlib import Path

from excel_normalize.a0001_v03 import build_a0001_v03_workbook
from excel_normalize.device_paths import device_workbook_path
from excel_normalize.normalize import normalize_workbook

ROOT = Path(__file__).resolve().parents[1]
DEVICE_DIR = ROOT / "fixtures" / "devices" / "A0001_塗布装置"
IMPORT_JSON = DEVICE_DIR / "import.json"


def main() -> None:
    DEVICE_DIR.mkdir(parents=True, exist_ok=True)
    (DEVICE_DIR / "archive").mkdir(exist_ok=True)

    master_xlsx = device_workbook_path(DEVICE_DIR)
    build_a0001_v03_workbook().save(master_xlsx)
    bundle = normalize_workbook(master_xlsx).bundle
    IMPORT_JSON.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    flow_count = len(bundle["flows"])
    unit_count = len(bundle["units"])
    print(
        f"Wrote {master_xlsx} -> {IMPORT_JSON} ({unit_count} units, {flow_count} flows)"
    )


if __name__ == "__main__":
    main()
