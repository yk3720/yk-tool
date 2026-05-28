-- ADR-013 DB-1: profiles + flow_documents + RLS

create table if not exists public.profiles (
  email text primary key,
  role text not null check (role in ('editor', 'viewer')),
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.flow_documents (
  module_id text primary key,
  title text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists flow_documents_updated_at_idx
  on public.flow_documents (updated_at desc);

alter table public.profiles enable row level security;
alter table public.flow_documents enable row level security;

-- profiles: 自分の行のみ参照（初回ログイン時は user_id が NULL のためメール照合も許可）
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR (select auth.uid()) = user_id
  );

-- 初回ログイン時に user_id を紐づけ（メール一致のみ）
create policy "profiles_update_link_self"
  on public.profiles for update
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (user_id = (select auth.uid()));

-- flow_documents: 許可ユーザーは全件閲覧
create policy "flow_documents_select_authenticated"
  on public.flow_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
    )
  );

-- flow_documents: editor のみ書き込み
create policy "flow_documents_insert_editor"
  on public.flow_documents for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'editor'
    )
  );

create policy "flow_documents_update_editor"
  on public.flow_documents for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'editor'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'editor'
    )
  );

create policy "flow_documents_delete_editor"
  on public.flow_documents for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.role = 'editor'
    )
  );
