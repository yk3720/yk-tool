"""ダミー装置 10 件（DEMO-003〜012）の装置 xlsx + import.json を生成する。"""

from __future__ import annotations

import json
from pathlib import Path

from excel_normalize.device_paths import device_workbook_path
from excel_normalize.device_workbook import (
    DeviceSpec,
    ModuleSpec,
    UnitSpec,
    build_device_workbook,
)
from excel_normalize.normalize import normalize_workbook

ROOT = Path(__file__).resolve().parents[1]
DEVICES_DIR = ROOT / "fixtures" / "devices"

DEMO_DEVICES: tuple[DeviceSpec, ...] = (
    DeviceSpec(
        "DEMO-003",
        "プレス機 C",
        (
            UnitSpec(
                "供給ユニット", (ModuleSpec("取出", "ワーク取出"), ModuleSpec("供給"))
            ),
            UnitSpec("加工ユニット", (ModuleSpec("プレス"), ModuleSpec("離脱"))),
        ),
    ),
    DeviceSpec(
        "DEMO-004",
        "組立ライン A",
        (
            UnitSpec("搬送ユニット", (ModuleSpec("受入"), ModuleSpec("搬送"))),
            UnitSpec("組立ユニット", (ModuleSpec("締付"), ModuleSpec("検査"))),
        ),
    ),
    DeviceSpec(
        "DEMO-005",
        "洗浄機",
        (
            UnitSpec("前処理ユニット", (ModuleSpec("投入"), ModuleSpec("洗浄"))),
            UnitSpec("後処理ユニット", (ModuleSpec("乾燥"), ModuleSpec("排出"))),
        ),
    ),
    DeviceSpec(
        "DEMO-006",
        "検査装置",
        (
            UnitSpec("供給ユニット", (ModuleSpec("供給"),)),
            UnitSpec("検査ユニット", (ModuleSpec("外観"), ModuleSpec("寸法"))),
        ),
    ),
    DeviceSpec(
        "DEMO-007",
        "塗装ブース",
        (
            UnitSpec("前工程ユニット", (ModuleSpec("マスキング"),)),
            UnitSpec("塗装ユニット", (ModuleSpec("スプレー"), ModuleSpec("乾燥"))),
        ),
    ),
    DeviceSpec(
        "DEMO-008",
        "梱包ライン",
        (
            UnitSpec("仕分けユニット", (ModuleSpec("仕分"),)),
            UnitSpec("梱包ユニット", (ModuleSpec("梱包"), ModuleSpec("シール"))),
        ),
    ),
    DeviceSpec(
        "DEMO-009",
        "溶接機",
        (
            UnitSpec("固定ユニット", (ModuleSpec("クランプ"),)),
            UnitSpec("溶接ユニット", (ModuleSpec("スポット"), ModuleSpec("冷却"))),
        ),
    ),
    DeviceSpec(
        "DEMO-010",
        "研削盤",
        (
            UnitSpec("搬送ユニット", (ModuleSpec("搬入"),)),
            UnitSpec("加工ユニット", (ModuleSpec("研削"), ModuleSpec("仕上"))),
        ),
    ),
    DeviceSpec(
        "DEMO-011",
        "曲げ機",
        (
            UnitSpec("供給ユニット", (ModuleSpec("セット"),)),
            UnitSpec("曲げユニット", (ModuleSpec("曲げ"), ModuleSpec("返送"))),
        ),
    ),
    DeviceSpec(
        "DEMO-012",
        "保管システム",
        (
            UnitSpec("入庫ユニット", (ModuleSpec("スキャン"), ModuleSpec("格納"))),
            UnitSpec("出庫ユニット", (ModuleSpec("ピック"), ModuleSpec("出荷"))),
        ),
    ),
)


def _device_dir(spec: DeviceSpec) -> Path:
    return DEVICES_DIR / f"{spec.internal_code}_{spec.display_name}"


def write_device(spec: DeviceSpec) -> tuple[Path, Path]:
    device_dir = _device_dir(spec)
    device_dir.mkdir(parents=True, exist_ok=True)
    (device_dir / "archive").mkdir(exist_ok=True)

    master_xlsx = device_workbook_path(device_dir)
    import_json = device_dir / "import.json"

    build_device_workbook(spec).save(master_xlsx)
    bundle = normalize_workbook(master_xlsx).bundle
    import_json.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return master_xlsx, import_json


def main() -> None:
    for spec in DEMO_DEVICES:
        master_xlsx, import_json = write_device(spec)
        flow_count = len(json.loads(import_json.read_text(encoding="utf-8"))["flows"])
        print(f"Wrote {master_xlsx} -> {import_json} ({flow_count} flows)")


if __name__ == "__main__":
    main()
