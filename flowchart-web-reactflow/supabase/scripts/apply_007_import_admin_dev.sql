-- Dev / 本番共用 DB 向け: import_equipment_bundle を admin も実行可に
-- 前提: 005 適用済み
-- SQL Editor: 007_import_bundle_admin_role.sql の全文を貼り付けて Run（本ファイルは索引用）

-- 検証（適用後）:
-- select proname from pg_proc where proname = 'import_equipment_bundle';
