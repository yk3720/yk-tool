# flowchart-web-reactflow

表データからフローチャートを自動生成する Web アプリ（**React Flow 描画** · `yk-tool` リポジトリ内）。

**旧ディレクトリ名:** `flowchart-web`（2026-05-23 リネーム · [ADR-010](c:/yk-memo/00.ai-driven-school/個人テーマ_フローチャートアプリ/04_decisions/意思決定記録(ADR).md)）

## 図モダリティ（YK 横断）

**方式選択の SSOT:** [`MERMAID_RULES.md` §1.5](c:/yk-skill/rule/45_mermaid/MERMAID_RULES.md#15-方式選択図モダリティ--yk-横断-ssot) · エージェント向け 3 分岐は [§1.5-1](c:/yk-skill/rule/45_mermaid/MERMAID_RULES.md#151-mermaid-3分岐エージェント向け--誤ルーティング防止)

本アプリは **表 JSON → React Flow**（Level・行順ベースのレイアウト）。**Mermaid `.mmd` の出力・インポートは Phase 外**。

| やりたいこと | 選ぶもの | SSOT |
|--------------|----------|------|
| 表・CSV · ブラウザ編集 · PNG/SVG 即出力（**React Flow**） | **本アプリ** | 本 README · `lib/flowchart/` · [`REACTFLOW_RULES.md`](c:/yk-skill/rule/35_reactflow/REACTFLOW_RULES.md) |
| 同じ表から **Mermaid プレビュー**（比較・検証用） | **flowchart-web-mermaid** | [`flowchart-web-mermaid/README.md` §図モダリティ](c:/yk-tool/flowchart-web-mermaid/README.md#図モダリティyk-横断) |
| テキスト版管理 · Git · MD/ADR 埋め込み | **Mermaid DSL** | [`MERMAID_RULES.md` §1.5](c:/yk-skill/rule/45_mermaid/MERMAID_RULES.md#15-方式選択図モダリティ--yk-横断-ssot) |
| Excel 連携デスクトップツール | **Python（MZ 系）** | [`PYTHON_RULES.md`](c:/yk-skill/rule/40_python/PYTHON_RULES.md) |

**索引 · 手順:** [`RULE_INDEX.md`](c:/yk-skill/rule/RULE_INDEX.md#タスク別クイック入口) · [`RULE_ROUTING_PLAYBOOK.md`（flowchart RF）](c:/yk-skill/rule/RULE_ROUTING_PLAYBOOK.md#読む順序flowchart-web-reactflow--react-flow-を触るとき) · `yk-tool/catalog.yaml` の `flowchart-web-reactflow`

**正本:** Excel / ブラウザ内の **8列表**（図形オートシェイプの図シートは正本にしない · ADR-010）。

## 企画 SSOT

`c:\yk-memo\00.ai-driven-school\個人テーマ_フローチャートアプリ\`

## 起動（ダブルクリック）

`フローチャートを開く.bat` をダブルクリック → ブラウザで http://localhost:3000（終了は窓で Ctrl+C）

## コマンド

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run test     # lib/flowchart
npm run test:e2e # Playwright
```

## M003 比較手順（ADR-010）

同一の Excel（8列表・例: M003）を **両アプリ**に取込み、分岐・合流の見え方を並べる。

1. ターミナル A: `flowchart-web-reactflow` で `npm run dev` → http://localhost:3000
2. ターミナル B: `flowchart-web-mermaid` で `npm run dev` → http://localhost:3001
3. 各アプリの「表」タブ → **Excel ファイル…** で同じ `.xlsx` を選ぶ → **再生成**
4. 判断ノードの Yes/No・合流位置を横に見比べる（Mermaid 版は自動レイアウトのため座標は一致しない）

## MVP（Phase 1）機能

- [x] 表 JSON 編集（内部）+ 表 UI + 再生成（自動レイアウト）
- [x] 5 種ノード（端子・処理・判断・入出力・手動入力）
- [x] Yes/No ラベル付きエッジ
- [x] 表を保存 / 表を読込（JSON）
- [x] 画像を保存（PNG）
- [x] 「プレビューは古い」表示
- [x] P0 UX: stale 時 PNG ブロック、表編集→再生成、エラー時プレビュー維持、閲覧専用表示

## ディレクトリ

| パス | 内容 |
|------|------|
| `lib/flowchart/` | ドメイン層（React 非依存） |
| `fixtures/` | サンプル JSON |
| `components/flowchart/` | UI（client） |
| `docs/adr/` | ADR（yk-memo と同期） |

## DB-1（ADR-013 · Supabase）

- [x] Supabase Auth（Google / Microsoft）
- [x] `profiles` 許可リスト · editor / viewer
- [x] `flow_documents` クラウド保存（Server Actions）
- [x] オフライン閲覧キャッシュ（IndexedDB · 開いたフロー + ピン）
- セットアップ: [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)

## 実用版（2026-05-20）

- [x] 表 UI・CSV 貼り付け・列ヘルプ
- [x] localStorage 下書き（自動保存・起動復元）
- [x] 雛形2種 · PNG / SVG 出力
- [x] エラー行ハイライト・ジャンプ・警告表示
- [x] 表 UI のみ（テーマ/サイズ/JSON タブは削除 · レイアウト・色は固定）

列の意味: `docs/列の意味.md`
