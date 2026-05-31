-- ADR-014 DB-2 (DRAFT): equipment hierarchy + flow_documents FK migration
-- Status: Accepted design — migration not yet applied (2026-05-31)
-- Depends on: 001_db1_schema.sql, 002_fix_profiles_role_protection.sql

-- ---------------------------------------------------------------------------
-- 1. Equipment hierarchy (4 tables)
-- ---------------------------------------------------------------------------

create table if not exists public.equipment_codes (
  internal_code text primary key,
  created_at timestamptz not null default now()
);

comment on table public.equipment_codes is
  'Company-internal equipment number only. No customer-identifying metadata.';

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  internal_code text not null unique references public.equipment_codes (internal_code) on delete restrict,
  display_name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devices_sort_order_idx on public.devices (sort_order);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete restrict,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, label)
);

create index if not exists units_device_sort_idx on public.units (device_id, sort_order);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete restrict,
  label text not null,
  sort_order int not null default 0,
  legacy_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, label)
);

create unique index if not exists modules_legacy_key_uidx
  on public.modules (legacy_key)
  where legacy_key is not null;

create index if not exists modules_unit_sort_idx on public.modules (unit_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2. flow_documents: text module_id -> uuid FK (requires data migration)
-- ---------------------------------------------------------------------------
-- NOTE: Apply in 004_flow_documents_module_fk.sql after seeding modules.
-- Draft steps documented in DB-2_スキーマ草案.md §5.

-- ---------------------------------------------------------------------------
-- 3. RLS (authenticated read; editor INSERT/UPDATE only — no DELETE per ADR-014)
-- ---------------------------------------------------------------------------

alter table public.equipment_codes enable row level security;
alter table public.devices enable row level security;
alter table public.units enable row level security;
alter table public.modules enable row level security;

-- equipment_codes
create policy "equipment_codes_select_authenticated"
  on public.equipment_codes for select to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid())));

create policy "equipment_codes_insert_editor"
  on public.equipment_codes for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

create policy "equipment_codes_update_editor"
  on public.equipment_codes for update to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'))
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

-- devices
create policy "devices_select_authenticated"
  on public.devices for select to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid())));

create policy "devices_insert_editor"
  on public.devices for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

create policy "devices_update_editor"
  on public.devices for update to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'))
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

-- units
create policy "units_select_authenticated"
  on public.units for select to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid())));

create policy "units_insert_editor"
  on public.units for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

create policy "units_update_editor"
  on public.units for update to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'))
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

-- modules
create policy "modules_select_authenticated"
  on public.modules for select to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid())));

create policy "modules_insert_editor"
  on public.modules for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

create policy "modules_update_editor"
  on public.modules for update to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'))
  with check (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'editor'));

-- No DELETE policies: Web edits flow payload only (ADR-014 § DELETE).
