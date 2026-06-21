"""装置フォルダ内 xlsx のパス規約。"""

from __future__ import annotations

from pathlib import Path

LEGACY_MASTER_XLSX = "マスター.xlsx"


def device_workbook_path(device_dir: Path) -> Path:
    """装置一式の正本 xlsx（新規作成用）。フォルダ名と同名。"""
    return device_dir / f"{device_dir.name}.xlsx"


def resolve_device_workbook(device_dir: Path) -> Path:
    """既存の装置 xlsx を解決。新名を優先、なければ マスター.xlsx（移行期）。"""
    named = device_workbook_path(device_dir)
    if named.is_file():
        return named
    legacy = device_dir / LEGACY_MASTER_XLSX
    if legacy.is_file():
        return legacy
    return named
