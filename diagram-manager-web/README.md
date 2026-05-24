# diagram-manager-web

surge.sh に公開した図解を **探して見返す** ための 3 ペイン Web アプリ（Next.js 16 · shadcn/ui）。

**正本:** `c:/yk-tool/diagram-manager-web/`（`yk-tool` リポジトリ内 · flowchart-web と同型の独立アプリ）

**企画・画面仕様:** `c:/yk-memo/00.ai-driven-school/第四回月次課題_自分専用のワークスペース/案1_図解管理ワークスペース.md`

**開発ルール:** `c:/yk-skill/rule/20_web_workspace/DIAGRAM_MANAGER_WORKSPACE_RULES.md`（`WORKSPACE_RULES.md` の次）

## 起動

```bash
cd c:/yk-tool/diagram-manager-web
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く（ルートが図解管理画面）。

## Vercel

- Git リポジトリ: `yk-tool`
- **Root Directory:** `diagram-manager-web`
- 環境変数: MVP 段階では不要（データは `data/figures.ts` ハードコード）

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
