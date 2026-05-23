# publish/

図解 HTML の物理正本（SSOT）を置くフォルダです。

- **台帳:** `c:/yk-skill/metadata/surge-published-list.md`
- **運用:** 各図解スキルの `output/` で作成 → surge デプロイ → 本フォルダへ `Copy-Item`
- **yk-memo:** `output/` はローカル退避用のみ（`.gitignore` で追跡除外）

**2026-05-23:** workspace-layout 移行で本フォルダへ集約（HTML 16 件 + デプロイ用ディレクトリ 6 件）。
