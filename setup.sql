-- Sketchbook: run this ONCE in your SCHOOL project (Supabase > SQL Editor > New query > paste > Run).
-- It adds one new table. It does not touch the portal's tables.
create table if not exists public.sketchbook_students (
  username   text primary key,
  pin        text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.sketchbook_students enable row level security;
drop policy if exists "sketchbook app access" on public.sketchbook_students;
create policy "sketchbook app access" on public.sketchbook_students
  for all to anon using (true) with check (true);
