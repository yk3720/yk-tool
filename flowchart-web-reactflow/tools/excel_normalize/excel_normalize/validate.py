from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class NormalizeError(Exception):
    messages: list[str]

    def __str__(self) -> str:
        return "\n".join(self.messages)


@dataclass
class NormalizeResult:
    bundle: dict
    warnings: list[str] = field(default_factory=list)


def validate_bundle(
    kosei,
    flows: list[dict],
) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    expected = {(r.unit_label, r.module_label) for r in kosei.rows}
    found = {(f["unit_label"], f["module_label"]) for f in flows}

    for unit_label, module_label in sorted(expected - found):
        errors.append(
            f"構成に「{unit_label} · {module_label}」がありますが、"
            f"ユニットシート「{unit_label}」に対応する Excel テーブルがありません。"
            f"テーブル名を動作名（{module_label}）に合わせてください。"
        )

    for unit_label, module_label in sorted(found - expected):
        errors.append(
            f"ユニットシート「{unit_label}」· テーブル「{module_label}」が構成シートにありません。"
            f"構成シートに行を追加するか、テーブルを削除してください。"
        )

    for flow in flows:
        table = flow["payload"]["table"]
        if not table:
            warnings.append(
                f"動作「{flow['unit_label']} · {flow['module_label']}」: フロー行が空です"
            )

    return errors, warnings
