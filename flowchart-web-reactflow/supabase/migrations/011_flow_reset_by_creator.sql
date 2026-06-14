-- Flow content reset: admin or flow_documents.created_by (grill 2026-06-12 · #9 slice 3)
-- Depends on: 008_unit_delete_created_by.sql, 010_device_delete_by_owner.sql

alter table public.flow_documents
  add column if not exists created_by uuid references auth.users (id) on delete set null;

comment on column public.flow_documents.created_by is
  'First creator of this flow row. Reset permission uses this column.';

update public.flow_documents
set created_by = updated_by
where created_by is null
  and updated_by is not null;

create or replace function public.flow_documents_set_created_by()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := new.updated_by;
  end if;
  return new;
end;
$$;

drop trigger if exists flow_documents_set_created_by on public.flow_documents;

create trigger flow_documents_set_created_by
  before insert on public.flow_documents
  for each row
  execute function public.flow_documents_set_created_by();

create or replace function public.rpc_reset_flow_content(
  p_module_id uuid,
  p_payload jsonb,
  p_title text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_module_id is null then
    raise exception 'module_id required';
  end if;

  if p_payload is null then
    raise exception 'payload required';
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

  if not exists (
    select 1
    from public.flow_documents fd
    where fd.module_id = p_module_id
  ) then
    raise exception 'flow_not_found';
  end if;

  if v_role <> 'admin'
     and not exists (
       select 1
       from public.flow_documents fd
       where fd.module_id = p_module_id
         and fd.created_by = v_uid
     )
  then
    raise exception 'reset_flow_forbidden';
  end if;

  update public.flow_documents fd
  set payload = p_payload,
      title = coalesce(nullif(trim(p_title), ''), fd.title),
      updated_at = now(),
      updated_by = v_uid
  where fd.module_id = p_module_id;
end;
$$;

comment on function public.rpc_reset_flow_content(uuid, jsonb, text) is
  'Reset flow_documents.payload to starter content. Caller must be admin or flow_documents.created_by.';

revoke all on function public.rpc_reset_flow_content(uuid, jsonb, text) from public;
grant execute on function public.rpc_reset_flow_content(uuid, jsonb, text) to authenticated;
