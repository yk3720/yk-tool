-- Dev 一括適用: 006 マイグレーション + ykoba56@gmail.com を admin
-- 対象: flowchart-dev（.env.local の jnywuetpkbzjdmcqghoh）
-- 前提: 001〜005 適用済み · SQL Editor でこのファイル全文を Run
-- 本番 Supabase には適用しない

-- ===========================================================================
-- 1. 006_admin_role_and_rpc.sql（本体）
-- ===========================================================================

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('editor', 'viewer', 'admin'));

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

-- ===========================================================================
-- 2. 管理者許可（role は SQL Editor / service のみ変更可）
-- ===========================================================================

insert into public.profiles (email, role)
values ('ykoba56@gmail.com', 'admin')
on conflict (email) do update set role = excluded.role;

-- ===========================================================================
-- 3. 検証（結果を目視）
-- ===========================================================================

select email, role, user_id
from public.profiles
where lower(email) = lower('ykoba56@gmail.com');

select proname as admin_rpc
from pg_proc
where proname in ('admin_delete_equipment', 'rpc_admin_delete_equipment')
order by proname;
