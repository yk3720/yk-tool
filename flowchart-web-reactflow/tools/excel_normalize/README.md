# Excel 正規化（Python）

入力用 Excel（構成 + ユニットシート · 横並びテーブル）を `import.json` に変換します。

**SSOT:** `c:/yk-memo/00.ai-driven-school/個人テーマ_フローチャートアプリ/02_spec/Excel取込_正規化パイプライン.md`

## 前提

- Python 3.10+
- 各動作ブロックは **Excel テーブル**（挿入 → テーブル）
- テーブル名: **`{ユニット短名}_{動作名}`**（例: `供給_取出`）— ブック全体で一意

## セットアップ

```powershell
cd c:\yk-tool\flowchart-web-reactflow\tools\excel_normalize
python -m pip install -e ".[dev]"
```

## テンプレ fixture 生成

```powershell
python scripts/build_fixture.py
```

`fixtures/input-device-z00001.xlsx` が出力されます（供給·収納 · 各2動作 · 横並び）。

## 正規化

```powershell
python -m excel_normalize.cli fixtures/input-device-z00001.xlsx -o fixtures/import-z00001.json
```

## テスト

```powershell
python -m pytest
```

## npm（リポジトリルートから）

```powershell
cd c:\yk-tool\flowchart-web-reactflow
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
