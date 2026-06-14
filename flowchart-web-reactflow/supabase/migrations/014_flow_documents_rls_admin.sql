-- flow_documents RLS: allow admin to insert/update (M-3 gap · 2026-06-14)
-- App: canEditFlowchart includes admin · saveFlowDocument upserts via client RLS
-- Depends on: 006_admin_role_and_rpc.sql

drop policy if exists "flow_documents_insert_editor" on public.flow_documents;
drop policy if exists "flow_documents_update_editor" on public.flow_documents;

create policy "flow_documents_insert_editor"
  on public.flow_documents for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('editor', 'admin')
    )
  );

create policy "flow_documents_update_editor"
  on public.flow_documents for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('editor', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('editor', 'admin')
    )
  );

comment on policy "flow_documents_insert_editor" on public.flow_documents is
  'Editor or admin may insert flow rows (cloud save upsert).';
comment on policy "flow_documents_update_editor" on public.flow_documents is
  'Editor or admin may update flow rows (cloud save upsert).';
