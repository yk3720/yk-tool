"""装置フォルダの xlsx を解決して import.json を生成する。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from excel_normalize.device_paths import resolve_device_workbook
from excel_normalize.normalize import normalize_workbook

ROOT = Path(__file__).resolve().parents[1]
DEVICES_DIR = ROOT / "fixtures" / "devices"


def find_device_dir(internal_code: str) -> Path:
    matches = sorted(
        p
        for p in DEVICES_DIR.iterdir()
        if p.is_dir() and p.name.startswith(f"{internal_code}_")
    )
    if not matches:
        print(f"装置フォルダが見つかりません: {internal_code}_*", file=sys.stderr)
        raise SystemExit(1)
    if len(matches) > 1:
        names = ", ".join(p.name for p in matches)
        print(f"装置フォルダが複数あります: {names}", file=sys.stderr)
        raise SystemExit(1)
    return matches[0]


def resolve_device_dir(arg: str) -> Path:
    candidate = Path(arg)
    if candidate.is_dir():
        return candidate.resolve()
    under_devices = DEVICES_DIR / arg
    if under_devices.is_dir():
        return under_devices
    return find_device_dir(arg)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="装置フォルダの xlsx を正規化して import.json を出力"
    )
    parser.add_argument(
        "device",
        help="社内番号（例: A0001）または fixtures/devices 以下のフォルダ名",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="出力先（省略時は装置フォルダ内の import.json）",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    device_dir = resolve_device_dir(args.device.strip())
    master_xlsx = resolve_device_workbook(device_dir)
    if not master_xlsx.is_file():
        print(
            f"xlsx が見つかりません: {master_xlsx}（旧名 マスター.xlsx も未作成）",
            file=sys.stderr,
        )
        return 1

    bundle = normalize_workbook(master_xlsx).bundle
    out = args.output or (device_dir / "import.json")
    out.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    flow_count = len(bundle["flows"])
    print(f"Wrote {out} ({flow_count} flows) from {master_xlsx.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
