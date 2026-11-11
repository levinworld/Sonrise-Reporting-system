-- Adds the Discipleship department so its report form appears in the app.
-- Safe to run more than once (does nothing if it already exists).
-- Run once in Supabase SQL Editor, same as the other migration files.
-- After this, create the Discipleship head's account from Admin > Manage People
-- and choose "Discipleship Department" as their department.

insert into departments (slug, name) values
  ('discipleship', 'Discipleship Department')
on conflict (slug) do nothing;
