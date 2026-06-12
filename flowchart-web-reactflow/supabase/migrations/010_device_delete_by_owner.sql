-- Device delete: admin or devices.created_by (grill 2026-06-12)
-- Depends on: 008_unit_delete_created_by.sql, 004 admin_delete_equipment

create or replace function public.rpc_delete_equipment(p_internal_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_code text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  v_code := trim(p_internal_code);
  if v_code is null or v_code = '' then
    raise exception 'internal_code required';
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

  if v_role <> 'admin'
     and not exists (
       select 1
       from public.devices d
       where d.internal_code = v_code
         and d.created_by = v_uid
     )
  then
    raise exception 'delete_equipment_forbidden';
  end if;

  perform public.admin_delete_equipment(v_code);
end;
$$;

comment on function public.rpc_delete_equipment(text) is
  'Delete equipment tree by internal_code. Caller must be admin or devices.created_by.';

revoke all on function public.rpc_delete_equipment(text) from public;
grant execute on function public.rpc_delete_equipment(text) to authenticated;
