-- =====================================================================
-- FIX: infinite recursion in profiles RLS policies
-- Run this once in Supabase SQL Editor. Safe to run even if some parts
-- already exist — it replaces the broken policies with working ones.
-- =====================================================================

-- Helper functions that check the current user's role WITHOUT re-triggering
-- RLS on profiles (this is what breaks the recursion loop).
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

-- ---- profiles ----
drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles
  for select using ( id = auth.uid() or is_leader_user() or is_admin_user() );

drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles
  for all using ( is_admin_user() );

-- ---- monthly_reports ----
drop policy if exists "reports_select" on monthly_reports;
create policy "reports_select" on monthly_reports
  for select using (
    department_id = my_department_id() or is_leader_user() or is_admin_user()
  );

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

-- ---- report_comments ----
drop policy if exists "comments_select" on report_comments;
create policy "comments_select" on report_comments
  for select using (
    exists (
      select 1 from monthly_reports r
      where r.id = report_comments.report_id
        and (is_leader_user() or is_admin_user() or r.department_id = my_department_id())
    )
  );

drop policy if exists "comments_insert" on report_comments;
create policy "comments_insert" on report_comments
  for insert with check (
    (is_leader_user() or is_admin_user()) and author_id = auth.uid()
  );

-- =====================================================================
-- END OF FIX
-- =====================================================================
