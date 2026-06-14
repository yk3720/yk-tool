-- DB-2 post-migration verification (read-only)
-- Run after 003_db2_schema.sql + 004_flow_documents_module_fk.sql
-- Optional: 005_import_equipment_bundle.sql (import.json bulk import)

select 'devices' as check_name, count(*)::text as result, '>=2 expected' as note
from public.devices
union all
select 'units', count(*)::text, '>=6'
from public.units
union all
select 'modules', count(*)::text, '>=10'
from public.modules;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'flow_documents'
  and column_name in ('module_id', 'module_id_legacy');

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('devices', 'units', 'modules', 'flow_documents')
  and cmd = 'DELETE';

select proname as admin_function
from pg_proc
where proname in ('admin_delete_equipment', 'rpc_admin_delete_equipment');

select proname as import_function, '005 optional' as note
from pg_proc
where proname = 'import_equipment_bundle';

select proname as delete_rpc, '008+' as note
from pg_proc
where proname in ('rpc_delete_unit', 'rpc_delete_equipment', 'rpc_reset_flow_content');

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'flow_documents'
  and column_name = 'created_by';
