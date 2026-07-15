-- =====================================================================
-- ADD: report_views — tracks when each person last viewed a report,
-- used to show "Pending" vs "Read" on the department-head dashboard.
-- Run this once in Supabase SQL Editor.
-- =====================================================================

create table if not exists report_views (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid not null references monthly_reports(id) on delete cascade,
  viewer_id      uuid not null references profiles(id) on delete cascade,
  last_viewed_at timestamptz not null default now(),
  unique (report_id, viewer_id)
);

alter table report_views enable row level security;

-- Everyone can read/write only their OWN view records — no need to see
-- who else has viewed something for this feature to work.
drop policy if exists "views_select_own" on report_views;
create policy "views_select_own" on report_views
  for select using ( viewer_id = auth.uid() );

drop policy if exists "views_insert_own" on report_views;
create policy "views_insert_own" on report_views
  for insert with check ( viewer_id = auth.uid() );

drop policy if exists "views_update_own" on report_views;
create policy "views_update_own" on report_views
  for update using ( viewer_id = auth.uid() );

-- =====================================================================
-- END
-- =====================================================================
