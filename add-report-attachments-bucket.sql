-- Storage bucket for report file attachments (currently used by Medical's
-- "attach the Excel medicinal log" field; any future department can reuse it
-- by adding a field with type: 'file' in schemas.js — no SQL change needed then).
--
-- Trust model matches the rest of the app: any signed-in account (department
-- head, leader, or admin) may upload; files are readable by anyone with the
-- link (the link itself is a long, unguessable storage path — not listed
-- anywhere public). Tighten this later with per-path RLS if you want finer
-- control, but this matches how the rest of the system treats staff as trusted.
--
-- Run this once in Supabase SQL Editor, same as the other migration files.

insert into storage.buckets (id, name, public)
values ('report-attachments', 'report-attachments', true)
on conflict (id) do nothing;

drop policy if exists "report attachments: authenticated upload" on storage.objects;
create policy "report attachments: authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'report-attachments');

drop policy if exists "report attachments: authenticated update" on storage.objects;
create policy "report attachments: authenticated update"
on storage.objects for update
to authenticated
using (bucket_id = 'report-attachments');

drop policy if exists "report attachments: public read" on storage.objects;
create policy "report attachments: public read"
on storage.objects for select
to public
using (bucket_id = 'report-attachments');
