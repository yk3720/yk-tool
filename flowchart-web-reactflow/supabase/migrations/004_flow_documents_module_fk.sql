-- ADR-014 DB-2: demo seed + flow_documents.module_id text -> uuid FK
-- Status: Accepted design — migration not yet applied (2026-05-31)
-- Depends on: 003_db2_schema.sql
--
-- Demo internal codes (legacy_key left = internal_code only):
--   DEMO-001  ← 旧 deviceId press-01
--   DEMO-002  ← 旧 deviceId press-02
-- legacy_key = '{internal_code}:{module_slug}'  e.g. DEMO-001:supply-feed

-- ---------------------------------------------------------------------------
-- 1. Demo seed (idempotent)
-- ---------------------------------------------------------------------------

insert into public.equipment_codes (internal_code)
values ('DEMO-001'), ('DEMO-002')
on conflict (internal_code) do nothing;

insert into public.devices (id, internal_code, display_name, sort_order)
values
  ('a0000001-0001-4001-8001-000000000001'::uuid, 'DEMO-001', 'プレス機 A', 0),
  ('a0000001-0001-4001-8001-000000000002'::uuid, 'DEMO-002', 'プレス機 B', 1)
on conflict (internal_code) do update
  set display_name = excluded.display_name,
      sort_order = excluded.sort_order;

-- DEMO-001 units
insert into public.units (id, device_id, label, sort_order)
values
  ('b0000001-0001-4001-8001-000000000101'::uuid, 'a0000001-0001-4001-8001-000000000001'::uuid, '供給ユニット', 0),
  ('b0000001-0001-4001-8001-000000000102'::uuid, 'a0000001-0001-4001-8001-000000000001'::uuid, 'プレスユニット', 1),
  ('b0000001-0001-4001-8001-000000000103'::uuid, 'a0000001-0001-4001-8001-000000000001'::uuid, '収納ユニット', 2)
on conflict (device_id, label) do update
  set sort_order = excluded.sort_order;

-- DEMO-002 units
insert into public.units (id, device_id, label, sort_order)
values
  ('b0000002-0001-4001-8001-000000000201'::uuid, 'a0000001-0001-4001-8001-000000000002'::uuid, '供給ユニット', 0),
  ('b0000002-0001-4001-8001-000000000202'::uuid, 'a0000001-0001-4001-8001-000000000002'::uuid, 'プレスユニット', 1),
  ('b0000002-0001-4001-8001-000000000203'::uuid, 'a0000001-0001-4001-8001-000000000002'::uuid, '収納ユニット', 2)
on conflict (device_id, label) do update
  set sort_order = excluded.sort_order;

-- DEMO-001 modules
insert into public.modules (id, unit_id, label, sort_order, legacy_key)
values
  ('c0000001-0001-4001-8001-000000001001'::uuid, 'b0000001-0001-4001-8001-000000000101'::uuid, '供給動作', 0, 'DEMO-001:supply-feed'),
  ('c0000001-0001-4001-8001-000000001002'::uuid, 'b0000001-0001-4001-8001-000000000101'::uuid, '検知動作', 1, 'DEMO-001:supply-detect'),
  ('c0000001-0001-4001-8001-000000001003'::uuid, 'b0000001-0001-4001-8001-000000000102'::uuid, 'プレス動作', 0, 'DEMO-001:press-cycle'),
  ('c0000001-0001-4001-8001-000000001004'::uuid, 'b0000001-0001-4001-8001-000000000102'::uuid, '離脱動作', 1, 'DEMO-001:press-release'),
  ('c0000001-0001-4001-8001-000000001005'::uuid, 'b0000001-0001-4001-8001-000000000103'::uuid, '排出動作', 0, 'DEMO-001:storage-eject')
on conflict (unit_id, label) do update
  set sort_order = excluded.sort_order,
      legacy_key = excluded.legacy_key;

-- DEMO-002 modules
insert into public.modules (id, unit_id, label, sort_order, legacy_key)
values
  ('c0000002-0001-4001-8001-000000002001'::uuid, 'b0000002-0001-4001-8001-000000000201'::uuid, '供給動作', 0, 'DEMO-002:b-supply-feed'),
  ('c0000002-0001-4001-8001-000000002002'::uuid, 'b0000002-0001-4001-8001-000000000201'::uuid, '検知動作', 1, 'DEMO-002:b-supply-detect'),
  ('c0000002-0001-4001-8001-000000002003'::uuid, 'b0000002-0001-4001-8001-000000000202'::uuid, 'プレス動作', 0, 'DEMO-002:b-press-cycle'),
  ('c0000002-0001-4001-8001-000000002004'::uuid, 'b0000002-0001-4001-8001-000000000202'::uuid, '離脱動作', 1, 'DEMO-002:b-press-release'),
  ('c0000002-0001-4001-8001-000000002005'::uuid, 'b0000002-0001-4001-8001-000000000203'::uuid, '排出動作', 0, 'DEMO-002:b-storage-eject')
on conflict (unit_id, label) do update
  set sort_order = excluded.sort_order,
      legacy_key = excluded.legacy_key;

-- ---------------------------------------------------------------------------
-- 2. Map DB-1 module_id text -> legacy_key (internal_code:module_slug)
-- ---------------------------------------------------------------------------

create or replace function public.migrate_module_draft_key_to_legacy(old_key text)
returns text
language sql
immutable
as $$
  select case
    when old_key ~ '^DEMO-[0-9]+:.+' then old_key
    when old_key like 'press-01:%' then 'DEMO-001:' || split_part(old_key, ':', 2)
    when old_key like 'press-02:%' then 'DEMO-002:' || split_part(old_key, ':', 2)
    when old_key in (
      'supply-feed', 'supply-detect', 'press-cycle', 'press-release', 'storage-eject'
    ) then 'DEMO-001:' || old_key
    else null
  end;
$$;

comment on function public.migrate_module_draft_key_to_legacy(text) is
  'One-off helper for 004 backfill. Maps press-01/02 and bare press-01 slugs to DEMO legacy_key.';

-- ---------------------------------------------------------------------------
-- 3. flow_documents: text PK -> uuid FK (modules.id)
-- ---------------------------------------------------------------------------

alter table public.flow_documents
  rename column module_id to module_id_legacy;

alter table public.flow_documents
  add column module_id uuid references public.modules (id) on delete restrict;

update public.flow_documents fd
set module_id = m.id
from public.modules m
where m.legacy_key = public.migrate_module_draft_key_to_legacy(fd.module_id_legacy);

do $$
begin
  if exists (
    select 1
    from public.flow_documents
    where module_id is null
  ) then
    raise exception
      'flow_documents backfill incomplete — unmapped module_id_legacy values remain. '
      'Inspect: select module_id_legacy from flow_documents where module_id is null;';
  end if;
end $$;

alter table public.flow_documents
  drop constraint flow_documents_pkey;

alter table public.flow_documents
  drop column module_id_legacy;

alter table public.flow_documents
  alter column module_id set not null;

alter table public.flow_documents
  add primary key (module_id);

-- ---------------------------------------------------------------------------
-- 4. RLS: remove editor DELETE on flow_documents (ADR-014)
-- ---------------------------------------------------------------------------

drop policy if exists "flow_documents_delete_editor" on public.flow_documents;

-- ---------------------------------------------------------------------------
-- 5. Optional: admin_delete_equipment (M-2 · project admin via SQL Editor)
-- ---------------------------------------------------------------------------

create or replace function public.admin_delete_equipment(p_internal_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id uuid;
begin
  if p_internal_code is null or length(trim(p_internal_code)) = 0 then
    raise exception 'internal_code required';
  end if;

  select id into v_device_id
  from public.devices
  where internal_code = p_internal_code;

  if v_device_id is null then
    raise exception 'device not found for internal_code %', p_internal_code;
  end if;

  delete from public.flow_documents fd
  using public.modules m
  join public.units u on u.id = m.unit_id
  where fd.module_id = m.id
    and u.device_id = v_device_id;

  delete from public.modules m
  using public.units u
  where m.unit_id = u.id
    and u.device_id = v_device_id;

  delete from public.units where device_id = v_device_id;
  delete from public.devices where id = v_device_id;
  delete from public.equipment_codes where internal_code = p_internal_code;
end;
$$;

comment on function public.admin_delete_equipment(text) is
  'Break-glass: delete equipment tree by internal_code. Supabase project admin / SQL Editor only. '
  'Not exposed to app editor role.';

revoke all on function public.admin_delete_equipment(text) from public;
revoke all on function public.admin_delete_equipment(text) from authenticated;
-- Grant only to service_role / postgres superuser via dashboard as needed.
