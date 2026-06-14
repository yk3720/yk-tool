-- Merge equipment_codes into devices (grill 2026-06-14 · Q6-C)
-- devices.internal_code remains the business key (1 code = 1 device).
-- Depends on: 011_flow_reset_by_creator.sql

-- ---------------------------------------------------------------------------
-- 1. admin_delete_equipment — drop equipment_codes step
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
end;
$$;

comment on function public.admin_delete_equipment(text) is
  'Break-glass: delete equipment tree by internal_code. Supabase project admin / SQL Editor only. '
  'Not exposed to app editor role.';

-- ---------------------------------------------------------------------------
-- 2. import_equipment_bundle — no equipment_codes insert (009 logic)
-- ---------------------------------------------------------------------------

create or replace function public.import_equipment_bundle(p_bundle jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_name text;
  v_device_id uuid;
  v_unit record;
  v_mod record;
  v_flow record;
  v_unit_id uuid;
  v_module_id uuid;
  v_modules_upserted int := 0;
  v_flows_upserted int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.user_id = v_uid
      and p.role in ('editor', 'admin')
  ) then
    raise exception 'editor_required';
  end if;

  v_code := trim(p_bundle->>'internal_code');
  v_name := trim(p_bundle->>'display_name');

  if v_code is null or v_code = '' then
    raise exception 'internal_code required';
  end if;
  if v_name is null or v_name = '' then
    raise exception 'display_name required';
  end if;

  if exists (select 1 from public.devices d where d.internal_code = v_code)
     and not exists (
       select 1
       from public.devices d
       join public.profiles p on p.user_id = v_uid
       where d.internal_code = v_code
         and (p.role = 'admin' or d.created_by = v_uid)
     )
  then
    raise exception 'import_existing_device_forbidden';
  end if;

  insert into public.devices (internal_code, display_name, sort_order, created_by)
  values (
    v_code,
    v_name,
    coalesce((p_bundle->>'device_sort_order')::int, 0),
    v_uid
  )
  on conflict (internal_code) do update
    set display_name = excluded.display_name,
        sort_order = excluded.sort_order,
        updated_at = now(),
        created_by = coalesce(public.devices.created_by, excluded.created_by)
  returning id into v_device_id;

  if v_device_id is null then
    select id into v_device_id
    from public.devices
    where internal_code = v_code;
  end if;

  for v_unit in
    select *
    from jsonb_to_recordset(coalesce(p_bundle->'units', '[]'::jsonb)) as x(
      label text,
      sort_order int,
      modules jsonb
    )
  loop
    insert into public.units (device_id, label, sort_order, created_by)
    values (v_device_id, v_unit.label, coalesce(v_unit.sort_order, 0), v_uid)
    on conflict (device_id, label) do update
      set sort_order = excluded.sort_order,
          updated_at = now(),
          created_by = coalesce(public.units.created_by, excluded.created_by)
    returning id into v_unit_id;

    if v_unit_id is null then
      select u.id into v_unit_id
      from public.units u
      where u.device_id = v_device_id
        and u.label = v_unit.label;
    end if;

    for v_mod in
      select *
      from jsonb_to_recordset(coalesce(v_unit.modules, '[]'::jsonb)) as m(
        label text,
        sort_order int
      )
    loop
      insert into public.modules (unit_id, label, sort_order)
      values (v_unit_id, v_mod.label, coalesce(v_mod.sort_order, 0))
      on conflict (unit_id, label) do update
        set sort_order = excluded.sort_order,
            updated_at = now();

      v_modules_upserted := v_modules_upserted + 1;
    end loop;
  end loop;

  for v_flow in
    select *
    from jsonb_to_recordset(coalesce(p_bundle->'flows', '[]'::jsonb)) as f(
      unit_label text,
      module_label text,
      title text,
      payload jsonb
    )
  loop
    select m.id into v_module_id
    from public.modules m
    join public.units u on u.id = m.unit_id
    where u.device_id = v_device_id
      and u.label = v_flow.unit_label
      and m.label = v_flow.module_label;

    if v_module_id is null then
      raise exception 'module not found: % · %', v_flow.unit_label, v_flow.module_label;
    end if;

    insert into public.flow_documents (
      module_id,
      title,
      payload,
      updated_at,
      updated_by
    )
    values (
      v_module_id,
      coalesce(nullif(trim(v_flow.title), ''), v_flow.module_label),
      v_flow.payload,
      now(),
      v_uid
    )
    on conflict (module_id) do update
      set title = excluded.title,
          payload = excluded.payload,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by;

    v_flows_upserted := v_flows_upserted + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'internal_code', v_code,
    'modules_upserted', v_modules_upserted,
    'flows_upserted', v_flows_upserted
  );
end;
$$;

comment on function public.import_equipment_bundle(jsonb) is
  'Editor/admin bulk import: devices → units → modules → flow_documents. '
  'Payload flows[].payload must be ModuleSnapshot json (prepared by app). Single transaction.';

-- ---------------------------------------------------------------------------
-- 3. Drop equipment_codes (merged into devices.internal_code)
-- ---------------------------------------------------------------------------

alter table public.devices
  drop constraint if exists devices_internal_code_fkey;

comment on column public.devices.internal_code is
  'Company-internal equipment number (1:1 with device). Former equipment_codes PK.';

drop policy if exists "equipment_codes_select_authenticated" on public.equipment_codes;
drop policy if exists "equipment_codes_insert_editor" on public.equipment_codes;
drop policy if exists "equipment_codes_update_editor" on public.equipment_codes;

drop table if exists public.equipment_codes;
