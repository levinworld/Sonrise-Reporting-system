-- =====================================================================
-- SONRISE MINISTRIES MONTHLY REPORTING SYSTEM — DATABASE SCHEMA
-- =====================================================================
-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor > New query).
-- Safe to re-run: uses IF NOT EXISTS / DROP ... IF EXISTS guards where sensible.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DEPARTMENTS
-- ---------------------------------------------------------------------
create table if not exists departments (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,       -- e.g. 'farm', 'transport'
  name        text not null,              -- e.g. 'Farm Department'
  created_at  timestamptz not null default now()
);

insert into departments (slug, name) values
  ('farm',           'Farm Department'),
  ('transport',      'Transport Department'),
  ('social_work',    'Social Work Department'),
  ('security',       'Security Department'),
  ('childrens_home', 'Children''s Home Department'),
  ('ict',            'ICT & Digital Services Department'),
  ('tailoring',      'Tailoring & Garment Production Department'),
  ('maintenance',    'Maintenance & Facilities Department'),
  ('medical',        'Medical / Clinic Department'),
  ('school',         'School Department'),
  ('procurement',    'Procurement & Stores Department'),
  ('accounts',       'Accounts & Finance Department')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. PROFILES  (one row per person, linked to their Supabase Auth user)
-- ---------------------------------------------------------------------
-- role model:
--   is_admin       -> George / system admin. Full access, can manage people, can override deadline.
--   is_leader      -> Directors, Ministry Manager, HR/Accounts Manager. Sees + comments on EVERY report.
--   department_id  -> if set, this person is the Head of that department and submits its monthly report.
-- Note: a person can be BOTH a department head AND a leader (e.g. Margaret Nambogwe).
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  email          text not null unique,
  role_title     text,                                  -- free-text label e.g. "Ministry Manager", "Farm Manager"
  department_id  uuid references departments(id),
  is_leader      boolean not null default false,
  is_admin       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. MONTHLY REPORTS
-- ---------------------------------------------------------------------
-- One row per department per month. `data` holds the full form payload as JSON,
-- structured according to that department's schema (see schemas.js in the app).
create table if not exists monthly_reports (
  id             uuid primary key default gen_random_uuid(),
  department_id  uuid not null references departments(id),
  report_month   int  not null check (report_month between 1 and 12),
  report_year    int  not null check (report_year between 2020 and 2100),
  data           jsonb not null default '{}'::jsonb,
  status         text not null default 'draft' check (status in ('draft','submitted')),
  submitted_by   uuid references profiles(id),
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (department_id, report_month, report_year)
);

-- ---------------------------------------------------------------------
-- 4. COMMENTS / WAY-FORWARD  (leaders comment, everyone entitled sees all)
-- ---------------------------------------------------------------------
create table if not exists report_comments (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null references monthly_reports(id) on delete cascade,
  author_id    uuid not null references profiles(id),
  comment      text not null,
  is_way_forward boolean not null default false,   -- true = flagged as an official "way forward" directive
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. HELPER FUNCTIONS
-- ---------------------------------------------------------------------

-- Returns true if it is currently on/before the 5th of the month, Uganda time.
create or replace function is_within_submission_window()
returns boolean language sql stable as $$
  select extract(day from (now() at time zone 'Africa/Kampala')) <= 5;
$$;

-- Returns the calling user's profile row (used inside RLS policies).
create or replace function my_profile()
returns profiles language sql stable security definer as $$
  select * from profiles where id = auth.uid();
$$;

-- Keep updated_at fresh.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_monthly_reports_updated_at on monthly_reports;
create trigger trg_monthly_reports_updated_at
  before update on monthly_reports
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table departments      enable row level security;
alter table profiles         enable row level security;
alter table monthly_reports  enable row level security;
alter table report_comments  enable row level security;

-- Departments: everyone signed in can read the list (needed for dropdowns etc).
drop policy if exists "departments_read_all" on departments;
create policy "departments_read_all" on departments
  for select using (auth.role() = 'authenticated');

-- Profiles: you can read your own row; leaders/admins can read everyone (needed to show names on comments).
drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles
  for select using (
    id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and (p.is_leader or p.is_admin))
  );

-- Only admins can insert/update/delete profiles directly from the client.
-- (In practice, people are created via the admin Netlify function using the service-role key,
--  which bypasses RLS entirely — this policy just protects direct client writes.)
drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Monthly reports: SELECT — own department, or any leader/admin.
drop policy if exists "reports_select" on monthly_reports;
create policy "reports_select" on monthly_reports
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.department_id = monthly_reports.department_id or p.is_leader or p.is_admin)
    )
  );

-- Monthly reports: INSERT/UPDATE — only the head of that department, only within the
-- submission window (1st–5th), unless the user is an admin (admins can always override).
drop policy if exists "reports_write" on monthly_reports;
create policy "reports_write" on monthly_reports
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.department_id = monthly_reports.department_id
        and (is_within_submission_window() or p.is_admin)
    )
  );

drop policy if exists "reports_update" on monthly_reports;
create policy "reports_update" on monthly_reports
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.department_id = monthly_reports.department_id
        and (is_within_submission_window() or p.is_admin)
    )
  );

-- Comments: SELECT — anyone who can see the parent report (leaders/admins, or the
-- department head who owns that report — so they can read feedback on their own work).
drop policy if exists "comments_select" on report_comments;
create policy "comments_select" on report_comments
  for select using (
    exists (
      select 1 from monthly_reports r
      join profiles p on p.id = auth.uid()
      where r.id = report_comments.report_id
        and (p.is_leader or p.is_admin or p.department_id = r.department_id)
    )
  );

-- Comments: INSERT — only leaders/admins may write comments or "way forward" notes.
drop policy if exists "comments_insert" on report_comments;
create policy "comments_insert" on report_comments
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and (p.is_leader or p.is_admin))
    and author_id = auth.uid()
  );

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
