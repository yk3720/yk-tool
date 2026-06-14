-- Dev seed: import_equipment_bundle と同等だが auth.uid() の代わりに admin/editor を actor に使う。
-- SQL Editor または service_role から seed_equipment_bundle(p_bundle) を呼ぶ。
-- 依存: 012 以降の import_equipment_bundle 本体と同型の payload（ModuleSnapshot json）。

create or replace function public.seed_equipment_bundle(p_bundle jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
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
  select p.user_id into v_uid
  from public.profiles p
  where p.role = 'admin'
  order by p.user_id
  limit 1;

  if v_uid is null then
    select p.user_id into v_uid
    from public.profiles p
    where p.role = 'editor'
    order by p.user_id
    limit 1;
  end if;

  if v_uid is null then
    raise exception 'seed_actor_not_found: profiles に admin または editor が必要です';
  end if;

  v_code := trim(p_bundle->>'internal_code');
  v_name := trim(p_bundle->>'display_name');

  if v_code is null or v_code = '' then
    raise exception 'internal_code required';
  end if;
  if v_name is null or v_name = '' then
    raise exception 'display_name required';
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
    'flows_upserted', v_flows_upserted,
    'seed_actor', v_uid
  );
end;
$$;

comment on function public.seed_equipment_bundle(jsonb) is
  'Dev seed: same as import_equipment_bundle but uses first admin/editor as actor. '
  'SQL Editor / service_role only — not for app authenticated users.';

revoke all on function public.seed_equipment_bundle(jsonb) from public;
revoke all on function public.seed_equipment_bundle(jsonb) from authenticated;
grant execute on function public.seed_equipment_bundle(jsonb) to service_role;
