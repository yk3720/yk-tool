# Excel 正規化（Python）

入力用 Excel（構成 + ユニットシート · 横並びテーブル）を `import.json` に変換します。

**SSOT:** `c:/yk-memo/00.ai-driven-school/個人テーマ_フローチャートアプリ/02_spec/Excel取込_正規化パイプライン.md`

## 作者 Excel の置き場所

**決定:** 2026-06-19 — 装置ごとの手書き xlsx は **`fixtures/devices/`** 以下に置く（`templates/` は空テンプレのみ · `yk-document/` は本アプリの取込 SSOT 外）。

**Git（2026-06-21）:** 作者用 **`.xlsx` / `.xls` はコミットしない**（`.gitignore`）。リポジトリに載せるのは **`import.json`** と Python コード。テンプレ・pytest 用 xlsx は `npm run excel:template` / `excel:fixture` でローカルまたは CI 生成。

| 種別               | パス（リポジトリルートから）                                                    |
| ------------------ | ------------------------------------------------------------------------------- |
| **装置ルート**     | `tools/excel_normalize/fixtures/devices/{社内番号}_{装置名}/`                   |
| **装置一式の正本** | 上記 / `{社内番号}_{装置名}.xlsx`（フォルダ名と同名）                           |
| **正規化出力**     | 上記 / `import.json`                                                            |
| **1 動作の試行**   | 上記 / `_scratch/{動作名}.xlsx`（1 シート · 10 列 · Web 表タブの Excel 取込用） |
| **旧版退避**       | 上記 / `archive/`                                                               |
| **空テンプレ**     | `tools/excel_normalize/templates/入力用テンプレ_v0.2.xlsx`（v0.2 小規模用）     |

### v0.3（大規模装置 · A0001 で採用）

| シート                             | 内容                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| **構成**                           | 6 列: 装置製番 · 装置名 · UinID · ユニット · MID · モジュール        |
| **装置名 / ユニット / モジュール** | マスター表（正規化では参照のみ · 構成が SSOT）                       |
| **U0〜U9**                         | ユニット別フロー表。テーブル名 = モジュール列と一致（例: `動作000`） |

再生成: `npm run excel:a0001:build`（10 ユニット × 10 モジュール = 100 フロー）

> **移行期:** 旧名 `マスター.xlsx` も `normalize_device.py` / pytest が読み取れます。新規作成・再生成は `{フォルダ名}.xlsx` のみ。

**現在の実装置（手書き作業）:** `A0001_塗布装置/` — 一覧は [`fixtures/devices/README.md`](fixtures/devices/README.md)

```text
c:/yk-tool/flowchart-web-reactflow/tools/excel_normalize/fixtures/devices/A0001_塗布装置/
  A0001_塗布装置.xlsx
  import.json
  _scratch/          ← 1 動作試行用（例: 取出.xlsx）
  archive/
```

## 前提

- Python 3.10+
- 各動作ブロックは **Excel テーブル**（挿入 → テーブル）
- テーブル名: **`{ユニット短名}_{動作名}`**（例: `供給_取出`）— ブック全体で一意

## セットアップ

```powershell
cd c:\yk-tool\flowchart-web-reactflow\tools\excel_normalize
python -m pip install -e ".[dev]"
```

## 作者向けテンプレ v0.2（現在の標準構成）

**配置:** [`templates/入力用テンプレ_v0.2.xlsx`](templates/入力用テンプレ_v0.2.xlsx)

- **構成:** 供給ユニット（取出 · 供給）+ 加工ユニット（プレス · 離脱）— DEMO-003 と同型
- 構成シート（4 列）+ ユニットシート 2 枚 · 各 2 動作（横並び Excel テーブル）
- テーブル名: `{ユニット短名}_{動作名}`（例: `供給_取出` · `加工_プレス`）
- `_使い方` シートに記入ルール（正規化対象外）

```powershell
python scripts/build_template.py
# またはリポジトリルート: npm run excel:template
```

### 新規装置フォルダを一括作成

```powershell
python scripts/scaffold_device.py Z00002 プレス機D --import-json
# または: npm run excel:new-device -- Z00002 プレス機D
```

`fixtures/devices/Z00002_プレス機D/Z00002_プレス機D.xlsx` と `archive/` ができます。

## 作者向けテンプレ v0.1（旧 · 供給 + 収納）

`workbook_builder.build_workbook()` — Z00001 fixture 用。新規装置は **v0.2** を使用。

## テスト用 fixture 生成

```powershell
python scripts/build_fixture.py
```

`fixtures/input-device-z00001.xlsx` が出力されます（テンプレと同構成 · `_使い方` なし）。

## 正規化

```powershell
python -m excel_normalize.cli fixtures/input-device-z00001.xlsx -o fixtures/import-z00001.json
```

## テスト

```powershell
python -m pytest
python -m mypy excel_normalize
```

## npm（リポジトリルートから）

```powershell
cd c:\yk-tool\flowchart-web-reactflow
npm run excel:template
npm run excel:fixture
npm run excel:normalize
npm run excel:test
```

## Web 取込（import.json）

1. 上記で `fixtures/import-z00001.json` を生成（または `-o` で任意パス）
2. dev Supabase に **`005_import_equipment_bundle.sql`** を適用（`docs/DB2_MIGRATION_RUNBOOK.md`）
3. Web アプリ（editor ログイン）→ **その他 → import.json を取込…**
4. 左ナビに装置が追加され、各動作のフローが読み込めること

**再取込:** 追加・更新のみ。構成から行を消しても DB からは自動削除されない（ADR-014）。
