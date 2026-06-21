"""新規装置フォルダ + 装置 xlsx を v0.2 構成で作成する。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from excel_normalize.device_paths import device_workbook_path
from excel_normalize.device_workbook import (
    DEFAULT_DEVICE_TEMPLATE,
    DeviceSpec,
    ModuleSpec,
    UnitSpec,
    build_device_workbook,
)
from excel_normalize.normalize import normalize_workbook

ROOT = Path(__file__).resolve().parents[1]
DEVICES_DIR = ROOT / "fixtures" / "devices"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="装置フォルダを v0.2 テンプレ構成で scaffold する"
    )
    parser.add_argument("internal_code", help="社内番号（例: Z00002）")
    parser.add_argument("display_name", help="装置名（例: プレス機D）")
    parser.add_argument(
        "--import-json",
        action="store_true",
        help="装置 xlsx から import.json も生成する",
    )
    return parser.parse_args()


def device_spec_from_template(internal_code: str, display_name: str) -> DeviceSpec:
    units = tuple(
        UnitSpec(
            unit.label,
            tuple(ModuleSpec(m.label, m.process_text) for m in unit.modules),
        )
        for unit in DEFAULT_DEVICE_TEMPLATE.units
    )
    return DeviceSpec(internal_code, display_name, units)


def main() -> int:
    args = parse_args()
    code = args.internal_code.strip()
    name = args.display_name.strip()
    if not code or not name:
        print("internal_code と display_name は必須です", file=sys.stderr)
        return 1

    device_dir = DEVICES_DIR / f"{code}_{name}"
    if device_dir.exists():
        print(f"既に存在します: {device_dir}", file=sys.stderr)
        return 1

    device_dir.mkdir(parents=True)
    (device_dir / "archive").mkdir()

    spec = device_spec_from_template(code, name)
    master_xlsx = device_workbook_path(device_dir)
    build_device_workbook(spec).save(master_xlsx)
    print(f"Wrote {master_xlsx}")

    if args.import_json:
        bundle = normalize_workbook(master_xlsx).bundle
        import_json = device_dir / "import.json"
        import_json.write_text(
            json.dumps(bundle, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {import_json}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
