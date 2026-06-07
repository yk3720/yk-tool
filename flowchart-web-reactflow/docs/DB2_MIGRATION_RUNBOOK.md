# DB-2 マイグレーション Runbook（003 → 005）

**対象:** 開発用 Supabase プロジェクト（`flowchart-dev` · `.env.local` の URL）  
**前提:** `001_db1_schema.sql` · `002_fix_profiles_role_protection.sql` **適用済み**  
**本番 Supabase には適用しない**（dev のみ · handoffs §4）

---

## 1. 手順（SQL Editor）

1. [Supabase Dashboard](https://supabase.com/dashboard) → **開発プロジェクト** を開く
2. **SQL Editor** → New query
3. **`003_db2_schema.sql` の全文** を貼り付け → **Run**
4. 成功したら **新しい query** で **`004_flow_documents_module_fk.sql` の全文** → **Run**（順序厳守）
5. **装置一括取込を使う場合のみ:** **`005_import_equipment_bundle.sql` の全文** → **Run**（004 の後 · 順序厳守）
6. 下記 **§3 検証 SQL** を実行

ファイルパス:

- `supabase/migrations/003_db2_schema.sql`
- `supabase/migrations/004_flow_documents_module_fk.sql`
- `supabase/migrations/005_import_equipment_bundle.sql`（Excel `import.json` 一括取込 · 任意だが Web 取込に必須）
- `supabase/migrations/verify_db2.sql`（検証のみ）

---

## 2. 004 が止まったとき

### 2.1 `flow_documents backfill incomplete`

未マップの `module_id_legacy` が残っています。

```sql
select module_id_legacy, count(*)
from public.flow_documents
where module_id is null
group by module_id_legacy;
```

**対処:**

1. 上記の値を `modules.legacy_key` と照合
2. 必要なら seed を追加するか、`migrate_module_draft_key_to_legacy()` の対応表を拡張（**004 再実行前に 003 状態へ戻す必要あり** — 初回は SQL Editor で手動 UPDATE を推奨）
3. 典型: `press-01:supply-feed` → `DEMO-001:supply-feed` は 004 内関数で変換済み

### 2.2 003 を誤って二重実行

`create table if not exists` / `create policy` は概ね idempotent。policy 名衝突時は Dashboard で既存 policy を確認。

### 2.3 004 **前**にデータ整理（dev 実績 · 2026-05-31）

004 実行**前**に `flow_documents` の text `module_id` を確認:

```sql
select module_id from public.flow_documents order by module_id;
```

| 問題 | 対処 |
|------|------|
| `spike%` 等のテストキー | `delete from public.flow_documents where module_id like 'spike%';` |
| `press-02:b-press-storage-eject`（誤キー） | `update ... set module_id = 'press-02:b-storage-eject' where module_id = 'press-02:b-press-storage-eject';` |
| `supply-feed` と `press-01:supply-feed` が **両方ある** | 旧形式を削除: `delete ... where module_id = 'supply-feed';`（正式キーを残す） |

### 2.4 `could not create unique index "flow_documents_pkey"`（uuid 重複）

`press-01:supply-feed` と bare `supply-feed` が同じ `modules.id` にマップされ二重行になる。**§2.3** で重複を消してから 004 を再 Run。

004 失敗時はトランザクションが **丸ごと取り消される** ことが多い（`module_id` が text のまま）。列確認:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'flow_documents' and table_schema = 'public'
order by ordinal_position;
```

---

## 3. 検証 SQL（§4 完了条件）

`verify_db2.sql` と同内容。すべて **期待どおり** なら §4 完了。

```sql
-- 4 表 + seed
select count(*) as equipment_codes from public.equipment_codes;          -- >= 2
select count(*) as devices from public.devices;                          -- >= 2
select count(*) as units from public.units;                              -- >= 6
select count(*) as modules from public.modules;                          -- >= 10

-- flow_documents.module_id は uuid
select data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'flow_documents'
  and column_name = 'module_id';
-- 期待: uuid

-- legacy 列が消えている
select count(*) as legacy_col
from information_schema.columns
where table_schema = 'public'
  and table_name = 'flow_documents'
  and column_name = 'module_id_legacy';
-- 期待: 0

-- editor DELETE ポリシーなし（flow_documents）
select count(*) as delete_policies
from pg_policies
where schemaname = 'public'
  and tablename = 'flow_documents'
  and cmd = 'DELETE';
-- 期待: 0

-- admin 関数
select proname from pg_proc where proname = 'admin_delete_equipment';
-- 期待: 1 行

-- 005 適用後（import.json 一括取込 · 任意）
select proname from pg_proc where proname = 'import_equipment_bundle';
-- 期待: 1 行（005 未適用なら 0 行）
```

---

## 4. 005 — import.json 一括取込

**Web:** その他 → **「import.json を取込…」**（editor · workspace のみ）

**正規化（ローカル）:**

```powershell
cd c:\yk-tool\flowchart-web-reactflow
npm run excel:normalize
# → tools/excel_normalize/fixtures/import-z00001.json
```

**005 未適用時:** Server Action が `import_equipment_bundle` RPC 不在で失敗。

**005 は idempotent:** `create or replace function` — 再 Run 可。

---

## 5. やる / やらない（§4）

| やる | やらない |
|------|----------|
| dev DB のみ 003 → 004（+ 005 は取込利用時） | 本番 DB |
| 上記検証 | アプリ uuid 化（次タスク #2） |
| 問題時 Runbook 追記 | commit（ユーザー明示まで） |

---

## 6. 参照

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [DB-2_スキーマ草案.md](c:/yk-memo/00.ai-driven-school/個人テーマ_フローチャートアプリ/02_spec/DB-2_スキーマ草案.md)
- ADR-014 · handoffs `2026-05-31_10_db2-schema-design-session-end.md` §4
