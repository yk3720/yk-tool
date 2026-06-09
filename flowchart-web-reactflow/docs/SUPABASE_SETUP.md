# Supabase セットアップ（ADR-013 DB-1）

## 1. プロジェクト

1. [Supabase](https://supabase.com/) で **本番用** と **開発（プレビュー）用** の 2 プロジェクトを作成
2. 各プロジェクトで **Authentication → Providers** で **Google** と **Azure（Microsoft）** を有効化
3. Redirect URL に次を追加:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_VERCEL_DOMAIN/auth/callback`

## 2. マイグレーション

### DB-1

SQL Editor で `supabase/migrations/001_db1_schema.sql` を実行。  
role 保護: `002_fix_profiles_role_protection.sql` を続けて実行。

### DB-2（003 → 004）

**開発 Supabase のみ。** 手順・検証・トラブルシュート: **[DB2_MIGRATION_RUNBOOK.md](./DB2_MIGRATION_RUNBOOK.md)**

1. `003_db2_schema.sql` — 装置 4 表 + RLS
2. `004_flow_documents_module_fk.sql` — デモ seed · uuid FK · `admin_delete_equipment()`
3. `verify_db2.sql` — 適用後チェック

**前提:** DB-1（001+002）適用済み · **アプリ変更は別タスク**（004 後に uuid 化）

## 3. 許可リスト（profiles）

ログイン前に、Table Editor → `profiles` に行を追加:

| email                | role     |
| -------------------- | -------- |
| `user@example.com`   | `editor` |
| `viewer@example.com` | `viewer` |

初回ログイン時に `user_id` が自動で紐づきます。

## 4. 環境変数

`.env.local`（git に含めない）:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

ローカルで Supabase なしで UI だけ試す場合:

```env
AUTH_DISABLED=1
```

## 5. Vercel

- Production: 本番 Supabase の URL / anon key
- Preview: 開発 Supabase の URL / anon key（本番 DB に書かない）

## 6. DB-1 完了チェック（ADR-013）

- [ ] editor / viewer でログインできる
- [ ] 許可外メールは `/login/no-access`
- [ ] editor がモジュール保存 → 再ログインで復元
- [ ] viewer は PNG/SVG のみ（JSON・表編集不可）
- [ ] オフラインでキャッシュしたフローを閲覧できる
