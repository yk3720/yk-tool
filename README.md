# yk-tool

YK ワークスペースの **生成物・アプリ** 用リポジトリ。

| フォルダ | 役割 |
|----------|------|
| `publish/` | 図解 HTML の物理正本（SSOT） |
| `apps/` | 図解以外の小さなアプリ・ツール |
| `workspace-ui-kit/` | Next.js ワークスペース（図解管理 UI 含む） |
| `flowchart-web/` | フローチャート Web |
| `playwright-test/` | E2E テスト |

## 関連リポジトリ

| リポ | 役割 |
|------|------|
| `yk-skill` | スキル · `rule/` · 公開台帳 `metadata/` |
| `yk-memo` | メモ · 企画（参考） |

## Git

- **remote:** `https://github.com/yk3720/yk-tool.git`（`yk-memo` · `yk-skill` と同じアカウント）
- **push 先:** 本リポジトリのみ（ui-kit 改造版もここに含める）
- **講座用 ADS リポ**（`git.ai-driven-school-portal.com/ADS/workspace-ui-kit`）とは切り離し済み（移行時に実施）

初回 push 前に GitHub で空リポ `yk-tool` を作成してから `git push -u origin main`。

恒久方針: `c:/yk-memo/YK_WORKSPACE_LAYOUT_HANDOFF.md`
