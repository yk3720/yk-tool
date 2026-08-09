# diagram-manager-web

surge.sh に公開した図解を **探して見返す** ための 3 ペイン Web アプリ（Next.js 16 · shadcn/ui）。

**正本:** `c:/yk-tool/diagram-manager-web/`（`yk-tool` リポジトリ内 · flowchart-studio と同型の独立アプリ）

**企画・画面仕様:** `c:/yk-memo/00.ai-driven-school/第四回月次課題_自分専用のワークスペース/案1_図解管理ワークスペース.md`

**開発ルール:** `c:/yk-skill/rule/20_web_workspace/DIAGRAM_MANAGER_WORKSPACE_RULES.md`（`WORKSPACE_RULES.md` の次）

## 起動

```bash
cd c:/yk-tool/diagram-manager-web
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く（ルートが図解管理画面）。

## データの記憶（Neon）

| 項目 | 内容 |
|------|------|
| **保存するもの** | 図解メタ（一覧）と **メモ** |
| **保存先** | Neon（Postgres）· `DATABASE_URL` |
| **未設定時** | `data/figures.ts` のモック（ヘッダーに「モック」表示） |

### セットアップ（ローカル）

1. [Vercel Dashboard](https://vercel.com) → 対象プロジェクト → **Storage** → **Neon** を Free で追加
2. Project → **Settings** → **Environment Variables** の `DATABASE_URL` をコピー
3. `diagram-manager-web/.env.local` を作り、次を書く:

```env
DATABASE_URL=（コピーした接続文字列）
```

4. `npm run dev` → ヘッダーが「Neon（永続）」になる
5. 初回アクセスで表作成＋シード投入。メモを編集して保存 → リロードで残ることを確認

手動 SQL 正本: `database/schema.sql`

## Vercel

- Git リポジトリ: `yk-tool`
- **Root Directory:** `diagram-manager-web`
- **Environment Variables:** Neon 連携で `DATABASE_URL` が自動注入される想定（未連携なら手動追加）

## 図解 HTML との関係

| 層 | ホスト |
|----|--------|
| 図解 HTML 本体 | **surge**（`yk-tool/publish/` が正本） |
| このアプリ（目次・検索・詳細） | **Vercel** |

## コマンド

| コマンド | 役割 |
|----------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint |
