-- Module delete: admin · device.created_by · unit.created_by (#9d)
-- Depends on: 008_unit_delete_created_by.sql

create or replace function public.rpc_delete_module(p_module_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_device_created_by uuid;
  v_unit_created_by uuid;
  v_found boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_module_id is null then
    raise exception 'module_id required';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.user_id = v_uid;

  if v_role is null then
    raise exception 'profile_required';
  end if;

  if v_role not in ('editor', 'admin') then
    raise exception 'editor_required';
  end if;

  select
    true,
    u.created_by,
    d.created_by
  into v_found, v_unit_created_by, v_device_created_by
  from public.modules m
  join public.units u on u.id = m.unit_id
  join public.devices d on d.id = u.device_id
  where m.id = p_module_id;

  if not coalesce(v_found, false) then
    raise exception 'module_not_found';
  end if;

  if v_role <> 'admin'
    and v_uid is distinct from v_device_created_by
    and v_uid is distinct from v_unit_created_by
  then
    raise exception 'delete_module_forbidden';
  end if;

  delete from public.flow_documents fd
  where fd.module_id = p_module_id;

  delete from public.modules m
  where m.id = p_module_id;
end;
$$;

comment on function public.rpc_delete_module(uuid) is
  'Delete one module and its flow_documents. Caller must be admin, device.created_by, or unit.created_by.';

revoke all on function public.rpc_delete_module(uuid) from public;
grant execute on function public.rpc_delete_module(uuid) to authenticated;
