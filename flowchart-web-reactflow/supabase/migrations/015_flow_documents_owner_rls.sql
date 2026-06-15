-- flow_documents: UPDATE restricted to admin or created_by (align with rpc_reset_flow_content)
-- import_equipment_bundle: do not overwrite another editor's flows unless admin or device owner re-import
-- Depends on: 011_flow_reset_by_creator.sql, 012_merge_equipment_codes_into_devices.sql, 014_flow_documents_rls_admin.sql

drop policy if exists "flow_documents_insert_editor" on public.flow_documents;
drop policy if exists "flow_documents_update_editor" on public.flow_documents;

create policy "flow_documents_insert_editor"
  on public.flow_documents for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('editor', 'admin')
    )
  );

create policy "flow_documents_update_editor"
  on public.flow_documents for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('editor', 'admin')
    )
    and (
      exists (
        select 1
        from public.profiles p
        where p.user_id = (select auth.uid())
          and p.role = 'admin'
      )
      or created_by = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('editor', 'admin')
    )
    and (
      exists (
        select 1
        from public.profiles p
        where p.user_id = (select auth.uid())
          and p.role = 'admin'
      )
      or created_by = (select auth.uid())
    )
  );

comment on policy "flow_documents_insert_editor" on public.flow_documents is
  'Editor or admin may insert new flow rows (first cloud save).';
comment on policy "flow_documents_update_editor" on public.flow_documents is
  'Editor or admin may update only flows they created; admin may update any.';

-- ---------------------------------------------------------------------------
-- import_equipment_bundle — preserve flows owned by another user (except device owner re-import)
-- ---------------------------------------------------------------------------

create or replace function public.import_equipment_bundle(p_bundle jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_code text;
  v_name text;
  v_device_id uuid;
  v_unit record;
  v_mod record;
  v_flow record;
  v_unit_id uuid;
  v_module_id uuid;
  v_flow_created_by uuid;
  v_modules_upserted int := 0;
  v_flows_upserted int := 0;
  v_device_owner uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.user_id = v_uid;

  if v_role is null or v_role not in ('editor', 'admin') then
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
       where d.internal_code = v_code
         and (v_role = 'admin' or d.created_by = v_uid)
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

  select d.created_by into v_device_owner
  from public.devices d
  where d.id = v_device_id;

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

    select fd.created_by into v_flow_created_by
    from public.flow_documents fd
    where fd.module_id = v_module_id;

    if v_flow_created_by is null
       and not exists (
         select 1
         from public.flow_documents fd
         where fd.module_id = v_module_id
       )
    then
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
      );
      v_flows_upserted := v_flows_upserted + 1;
    elsif v_role = 'admin'
       or v_flow_created_by = v_uid
       or v_flow_created_by is null
       or v_device_owner = v_uid
    then
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
    end if;
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
  'Editor/admin bulk import. Flow overwrite: admin, flow creator, legacy null created_by, or device owner re-import only.';
