# yk-tool/scripts — ワークスペース横断スクリプト

**正本:** 本フォルダ · [`catalog.yaml`](../catalog.yaml)（`scripts:` + `hook_bindings:`）  
**配置ルール（L1）:** [`WORKSPACE_SCRIPTS_RULES.md`](c:/yk-skill/rule/60_tooling/WORKSPACE_SCRIPTS_RULES.md)  
**索引:** [`RULE_INDEX.md`](c:/yk-skill/rule/RULE_INDEX.md) §横断パス一覧

---

## yk-skill ではなく yk-tool か

| 観点 | yk-tool（採用） | yk-skill（非採用） |
|------|-----------------|-------------------|
| リポの役割 | 成果物 · 実行可能ツール | rule · スキル（指示系） |
| 業界パターン | ops/scripts + catalog（[Script Library](https://codenscripts.com/organize-your-script-library-practical-folder-structures-and)） | rules/docs と CLI を分離（[STOA ADR-003](https://docs.gostoa.dev/docs/architecture/adr/adr-003-monorepo-architecture)） |
| 既存 YK 方針 | `catalog.yaml` · workspace-layout §5-2 | スキル内 `scripts/` のみ（図解デプロイ等） |

**横断スクリプトは yk-tool のみ。** yk-skill には「置き場ルール」文書（`WORKSPACE_SCRIPTS_RULES.md`）だけ置く。

---

## 置き場の判断

| 置き場 | いつ使う | 台帳 |
|--------|----------|------|
| **`yk-tool/scripts/`**（ここ） | 複数リポ横断 · hook/CI | `catalog.yaml` `scripts:` |
| **`yk-tool/{app}/scripts/`** | 1 アプリ専用 | `catalog.yaml` `tools[].local_scripts` |
| **`yk-tool/apps/*/`** 内スキル scripts | 1 ツール専用自動化 | ツール notes |
| **`yk-application/{app}/scripts/`** | 製品専用 | 製品リポ |
| **`yk-skill/.claude/skills/*/scripts/`** | スキル実行時のみ | `SKILL_CATALOG.md` |

---

## 新規スクリプト追加手順

1. 本フォルダにファイル追加
2. [`catalog.yaml`](../catalog.yaml) の `scripts:` に登録
3. hook 利用時は `hook_bindings:` に利用側パスを追記
4. 本 README の一覧を更新
5. `.\validate-catalog.ps1 -FailOnError` で台帳整合

**環境変数:** `YK_TOOL_ROOT`（未設定時 `c:/yk-tool`）

---

## 一覧

| id | ファイル | 用途 |
|----|----------|------|
| `check-markdown-links` | [check-markdown-links.ps1](./check-markdown-links.ps1) | MD ローカルリンク検証 |
| `check-markdown-links-staged` | [check-markdown-links-staged.ps1](./check-markdown-links-staged.ps1) | git ステージ済み `.md` |
| `validate-catalog` | [validate-catalog.ps1](./validate-catalog.ps1) | 台帳と実ファイルの整合 |
| `audit-rule-line-counts` | [audit-rule-line-counts.ps1](./audit-rule-line-counts.ps1) | yk-skill/rule 行数監査（250 WARN · 500 FAIL） |

### hook 連携（`hook_bindings:` 参照）

| consumer | hook | 設定ファイル |
|----------|------|--------------|
| yk-memo | git-pre-commit | [`yk-memo/.githooks/pre-commit`](../../yk-memo/.githooks/pre-commit) |
| yk-memo | cursor-afterFileEdit | [`yk-memo/.cursor/hooks/after-markdown-edit.ps1`](../../yk-memo/.cursor/hooks/after-markdown-edit.ps1) |

---

## 実行例

```powershell
# 台帳検証
powershell -NoProfile -ExecutionPolicy Bypass -File c:/yk-tool/scripts/validate-catalog.ps1 -FailOnError

# ルール行数監査（500行超で exit 1 · WARN のみは通過）
powershell -NoProfile -ExecutionPolicy Bypass -File c:/yk-tool/scripts/audit-rule-line-counts.ps1 -FailOnError

# リンクチェック
powershell -NoProfile -ExecutionPolicy Bypass -File c:/yk-tool/scripts/check-markdown-links.ps1 `
  -Path 'c:/yk-memo' -ExcludePath '99_アーカイブ','archive'
```

---

*最終更新: 2026-06-27*
