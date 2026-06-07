from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .normalize import NormalizeError, normalize_workbook


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="入力用 Excel（構成 + ユニットシート）→ import.json"
    )
    parser.add_argument("input", type=Path, help="入力用 .xlsx")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="出力 import.json（省略時は stdout）",
    )
    args = parser.parse_args(argv)

    if not args.input.is_file():
        print(f"ファイルがありません: {args.input}", file=sys.stderr)
        return 1

    try:
        result = normalize_workbook(args.input)
    except NormalizeError as exc:
        for msg in exc.messages:
            print(msg, file=sys.stderr)
        return 1
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    text = json.dumps(result.bundle, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)

    for warning in result.warnings:
        print(f"警告: {warning}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
