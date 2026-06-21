from __future__ import annotations

from pathlib import Path

from excel_normalize.device_paths import (
    LEGACY_MASTER_XLSX,
    device_workbook_path,
    resolve_device_workbook,
)


def test_device_workbook_path_matches_folder_name(tmp_path: Path) -> None:
    device_dir = tmp_path / "A0001_塗布装置"
    device_dir.mkdir()
    assert device_workbook_path(device_dir) == device_dir / "A0001_塗布装置.xlsx"


def test_resolve_prefers_named_over_legacy(tmp_path: Path) -> None:
    device_dir = tmp_path / "Z00001_プレス機"
    device_dir.mkdir()
    named = device_workbook_path(device_dir)
    legacy = device_dir / LEGACY_MASTER_XLSX
    named.write_text("named", encoding="utf-8")
    legacy.write_text("legacy", encoding="utf-8")
    assert resolve_device_workbook(device_dir) == named


def test_resolve_falls_back_to_legacy(tmp_path: Path) -> None:
    device_dir = tmp_path / "Z00001_プレス機"
    device_dir.mkdir()
    legacy = device_dir / LEGACY_MASTER_XLSX
    legacy.write_text("legacy", encoding="utf-8")
    assert resolve_device_workbook(device_dir) == legacy


def test_resolve_defaults_to_named_when_missing(tmp_path: Path) -> None:
    device_dir = tmp_path / "Z00001_プレス機"
    device_dir.mkdir()
    assert resolve_device_workbook(device_dir) == device_workbook_path(device_dir)
