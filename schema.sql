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

-- Helper functions that check the current user's role WITHOUT re-triggering RLS
-- on profiles (querying profiles directly inside a profiles policy causes
-- infinite recursion — these security-definer functions avoid that).
create or replace function is_admin_user()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

create or replace function is_leader_user()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_leader from profiles where id = auth.uid()), false);
$$;

create or replace function my_department_id()
returns uuid language sql security definer stable set search_path = public as $$
  select department_id from profiles where id = auth.uid();
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

-- Profiles: you can read your own row; leaders/admins can read everyone.
drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles
  for select using ( id = auth.uid() or is_leader_user() or is_admin_user() );

-- Only admins can insert/update/delete profiles directly from the client.
drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles
  for all using ( is_admin_user() );

-- Monthly reports: SELECT — own department, or any leader/admin.
drop policy if exists "reports_select" on monthly_reports;
create policy "reports_select" on monthly_reports
  for select using (
    department_id = my_department_id() or is_leader_user() or is_admin_user()
  );

-- Monthly reports: INSERT/UPDATE — only the head of that department, only
-- within the submission window (1st-5th), unless the user is an admin.
drop policy if exists "reports_write" on monthly_reports;
create policy "reports_write" on monthly_reports
  for insert with check (
    department_id = my_department_id() and (is_within_submission_window() or is_admin_user())
  );

drop policy if exists "reports_update" on monthly_reports;
create policy "reports_update" on monthly_reports
  for update using (
    department_id = my_department_id() and (is_within_submission_window() or is_admin_user())
  );

-- Comments: SELECT — anyone who can see the parent report.
drop policy if exists "comments_select" on report_comments;
create policy "comments_select" on report_comments
  for select using (
    exists (
      select 1 from monthly_reports r
      where r.id = report_comments.report_id
        and (is_leader_user() or is_admin_user() or r.department_id = my_department_id())
    )
  );

-- Comments: INSERT — only leaders/admins may write comments or "way forward" notes.
drop policy if exists "comments_insert" on report_comments;
create policy "comments_insert" on report_comments
  for insert with check (
    (is_leader_user() or is_admin_user()) and author_id = auth.uid()
  );

-- ---------------------------------------------------------------------
-- 7. REPORT VIEWS  (tracks per-person read status for the dashboard "Pending"/"Read" indicator)
-- ---------------------------------------------------------------------
create table if not exists report_views (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid not null references monthly_reports(id) on delete cascade,
  viewer_id      uuid not null references profiles(id) on delete cascade,
  last_viewed_at timestamptz not null default now(),
  unique (report_id, viewer_id)
);

alter table report_views enable row level security;

drop policy if exists "views_select_own" on report_views;
create policy "views_select_own" on report_views
  for select using ( viewer_id = auth.uid() );

drop policy if exists "views_insert_own" on report_views;
create policy "views_insert_own" on report_views
  for insert with check ( viewer_id = auth.uid() );

drop policy if exists "views_update_own" on report_views;
create policy "views_update_own" on report_views
  for update using ( viewer_id = auth.uid() );

-- ---------------------------------------------------------------------
-- 8. MINISTRY MANAGER EXECUTIVE REPORT (see add-executive-report.sql)
-- ---------------------------------------------------------------------
-- =====================================================================
-- MINISTRY MANAGER EXECUTIVE REPORT
-- Adds: a director flag, a separate executive_reports table with restricted
-- visibility (only the author + directors + admin), and extends the existing
-- comment system so directors can comment on executive reports too.
-- Run this once in Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Director flag on profiles
-- ---------------------------------------------------------------------
-- is_director -> the two Executive Directors (Melissa & Ivan). Directors are
-- also leaders (is_leader = true), but this extra flag lets us route the
-- Ministry Manager's confidential executive report to ONLY them.
alter table profiles add column if not exists is_director boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. Who can write the executive report?
-- ---------------------------------------------------------------------
-- is_ministry_manager -> the person who authors the executive report (Brenda).
-- Only one person has this. Kept as its own flag so it's independent of
-- department assignment (Brenda has no department of her own).
alter table profiles add column if not exists is_ministry_manager boolean not null default false;

-- helper: is the caller a director?
create or replace function is_director_user()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_director from profiles where id = auth.uid()), false);
$$;

-- helper: is the caller the ministry manager?
create or replace function is_ministry_manager_user()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_ministry_manager from profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- 3. Executive reports table
-- ---------------------------------------------------------------------
create table if not exists executive_reports (
  id             uuid primary key default gen_random_uuid(),
  report_month   int  not null check (report_month between 1 and 12),
  report_year    int  not null check (report_year between 2020 and 2100),
  data           jsonb not null default '{}'::jsonb,
  status         text not null default 'draft' check (status in ('draft','submitted')),
  submitted_by   uuid references profiles(id),
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (report_month, report_year)
);

drop trigger if exists trg_executive_reports_updated_at on executive_reports;
create trigger trg_executive_reports_updated_at
  before update on executive_reports
  for each row execute function set_updated_at();

alter table executive_reports enable row level security;

-- SELECT: only the ministry manager (author), directors, and admins.
-- Deliberately NOT visible to other leaders (e.g. Margaret) or department heads.
drop policy if exists "exec_select" on executive_reports;
create policy "exec_select" on executive_reports
  for select using (
    is_ministry_manager_user() or is_director_user() or is_admin_user()
  );

-- INSERT/UPDATE: only the ministry manager, within the submission window
-- (or an admin override). Same deadline logic as department reports.
drop policy if exists "exec_insert" on executive_reports;
create policy "exec_insert" on executive_reports
  for insert with check (
    (is_ministry_manager_user() and is_within_submission_window()) or is_admin_user()
  );

drop policy if exists "exec_update" on executive_reports;
create policy "exec_update" on executive_reports
  for update using (
    (is_ministry_manager_user() and is_within_submission_window()) or is_admin_user()
  );

-- ---------------------------------------------------------------------
-- 4. Extend comments to cover executive reports
-- ---------------------------------------------------------------------
-- Add an optional executive_report_id alongside the existing report_id, so the
-- same report_comments table serves both. Exactly one of the two is set.
alter table report_comments add column if not exists executive_report_id uuid references executive_reports(id) on delete cascade;
alter table report_comments alter column report_id drop not null;

-- SELECT comments: existing rule for department reports PLUS a rule for
-- executive-report comments (visible to manager, directors, admins).
drop policy if exists "comments_select" on report_comments;
create policy "comments_select" on report_comments
  for select using (
    (
      report_id is not null and exists (
        select 1 from monthly_reports r
        where r.id = report_comments.report_id
          and (is_leader_user() or is_admin_user() or r.department_id = my_department_id())
      )
    )
    or (
      executive_report_id is not null and (
        is_ministry_manager_user() or is_director_user() or is_admin_user()
      )
    )
  );

-- INSERT comments: leaders/admins on department reports (existing), plus
-- directors/admins/manager on executive reports.
drop policy if exists "comments_insert" on report_comments;
create policy "comments_insert" on report_comments
  for insert with check (
    author_id = auth.uid()
    and (
      (report_id is not null and (is_leader_user() or is_admin_user()))
      or (executive_report_id is not null and (is_director_user() or is_admin_user() or is_ministry_manager_user()))
    )
  );

-- =====================================================================
-- 5. After running this, flag the right people (edit emails if needed):
--    Directors (also mark them as leaders if not already):
--      update profiles set is_director = true, is_leader = true
--        where email in ('melissamukulu@sonriseminchildren.org','ivanmukulu@sonriseminchildren.org');
--    Ministry Manager (Brenda) — she authors the executive report:
--      update profiles set is_ministry_manager = true
--        where email = 'brendaarinda@sonriseminchildren.org';
-- =====================================================================

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
