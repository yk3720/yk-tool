# flowchart-web

表データからフローチャートを自動生成する Web アプリ（`yk-tool` リポジトリ内）。

## 企画 SSOT

`c:\yk-memo\00.ai-driven-school\フローチャートアプリ\`

## 起動（ダブルクリック）

`フローチャートを開く.bat` をダブルクリック → ブラウザで http://localhost:3000（終了は窓で Ctrl+C）

## コマンド

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run test     # lib/flowchart（7 tests）
npm run test:e2e # AC + P0 UX 手動確認（Playwright）
```

## MVP（Phase 1）機能

- [x] 表 JSON 編集 + 再生成（自動レイアウト）
- [x] 5 種ノード（端子・処理・判断・入出力・手動入力）
- [x] Yes/No ラベル付きエッジ
- [x] 表を保存 / 表を読込（JSON）
- [x] 画像を保存（PNG）
- [x] 「プレビューは古い」表示
- [x] P0 UX: stale 時 PNG ブロック、表↔JSON 同期、エラー時プレビュー維持、閲覧専用表示

## テスト

```bash
npm run test   # 4 tests（parse + generate + toReactFlow）
```

## ディレクトリ

| パス | 内容 |
|------|------|
| `lib/flowchart/` | ドメイン層（React 非依存） |
| `fixtures/` | サンプル JSON |
| `components/flowchart/` | UI（client） |
| `docs/adr/` | ADR（yk-memo と同期） |

## 実用版（2026-05-20）

- [x] 表 UI・CSV 貼り付け・列ヘルプ
- [x] localStorage 下書き（自動保存・起動復元）
- [x] 雛形2種・テーマ3種・レイアウト大中小
- [x] PNG / SVG 出力
- [x] エラー行ハイライト・ジャンプ・警告表示
- [x] P0 UX（stale 時 PNG ブロック等）

列の意味: `docs/列の意味.md`
