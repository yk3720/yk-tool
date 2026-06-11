-- M-3 v0.1: profiles.role = admin + app-facing delete RPC
-- Depends on: 004_flow_documents_module_fk.sql (admin_delete_equipment)

-- ---------------------------------------------------------------------------
-- 1. Allow admin in profiles.role
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('editor', 'viewer', 'admin'));

-- ---------------------------------------------------------------------------
-- 2. RPC wrapper — authenticated admin only (calls break-glass M-2 function)
-- ---------------------------------------------------------------------------

create or replace function public.rpc_admin_delete_equipment(p_internal_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'admin_required';
  end if;

  perform public.admin_delete_equipment(p_internal_code);
end;
$$;

comment on function public.rpc_admin_delete_equipment(text) is
  'M-3: delete equipment tree by internal_code. Caller must have profiles.role = admin.';

revoke all on function public.rpc_admin_delete_equipment(text) from public;
grant execute on function public.rpc_admin_delete_equipment(text) to authenticated;
