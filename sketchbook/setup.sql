-- SKETCHBOOK + PORTAL: one student list, locked-down database (version 2).
--
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run.
-- Safe to run more than once.
--
-- What it does
--   * Sketchbook now signs students in from the PORTAL's student list (same name, same 4-digit code).
--     Nobody can sign themselves up any more. A student gets in only if the teacher added them
--     and ticked Sketchbook in their programs.
--   * Turns on Row Level Security and removes all direct access for the public (anon) key on the
--     student tables. Everything goes through the functions below, which check the code or the
--     teacher password inside Supabase. The teacher password is the portal's (stored as a hash).
--   * Keeps every student's Sketchbook progress. Each existing Sketchbook student is added to the portal
--     as a NEW, separate student with the code they already use. It never links Sketchbook progress to
--     an existing portal student by name. The Sketchbook student "Chavi" (Chavi Greenes) becomes
--     "Chavi G." so she stays separate from the portal's other Chavi.
--   * Changes only Sketchbook's own tables. The portal's tables (portal_students, portal_programs,
--     portal_admin, portal_log) and every other program's tables and functions are left as they are;
--     it only adds rows to portal_students/portal_programs.
--   * Adds a Sketchbook button to the portal if there isn't one yet.
--
-- At the end you get a small table showing what happened to each Sketchbook student.

set search_path = public, extensions;

------------------------------------------------------------------------------------------------
-- 1. Tables
------------------------------------------------------------------------------------------------
create table if not exists public.sketchbook_students (
  username   text primary key,
  pin        text,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.sketchbook_students add column if not exists student_id uuid;
alter table public.sketchbook_students alter column pin drop not null;
create unique index if not exists sketchbook_students_student_id on public.sketchbook_students(student_id);

create table if not exists public.sketchbook_sessions (
  token      uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

------------------------------------------------------------------------------------------------
-- 2. Lock Sketchbook's tables: Row Level Security on, no policies, no direct access for anon/authenticated.
--    (The portal's tables already give the public key no access, and are not changed here.)
------------------------------------------------------------------------------------------------
drop policy if exists "sketchbook app access" on public.sketchbook_students;
alter table public.sketchbook_students enable row level security;
alter table public.sketchbook_sessions enable row level security;
revoke all on public.sketchbook_students from anon, authenticated;
revoke all on public.sketchbook_sessions from anon, authenticated;

------------------------------------------------------------------------------------------------
-- 3. Helpers (not callable from the web page)
------------------------------------------------------------------------------------------------
create or replace function public._sketch_norm(t text) returns text
language sql immutable as $$
  select lower(regexp_replace(trim(replace(coalesce(t, ''), '.', '')), '\s+', ' ', 'g'))
$$;

create or replace function public._sketch_program_id() returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select id from public.portal_programs
   where url ilike '%sketchbook%' or name ilike 'sketchbook%'
   order by (url ilike '%sketchbook%') desc, sort nulls last limit 1
$$;

create or replace function public._sketch_admin(p_pass text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pass is null or not public._portal_is_admin(p_pass) then
    raise exception 'Wrong teacher password';
  end if;
end $$;

revoke execute on function public._sketch_program_id() from public, anon, authenticated;
revoke execute on function public._sketch_admin(text) from public, anon, authenticated;

------------------------------------------------------------------------------------------------
-- 4. Student functions (used by Sketchbook)
------------------------------------------------------------------------------------------------
create or replace function public.sketch_login(p_name text, p_pin text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare s record; pid uuid; tok uuid; r record;
begin
  select * into s from public.portal_students
    where public._sketch_norm(name) = public._sketch_norm(p_name) limit 1;
  if not found then return json_build_object('ok', false, 'error', 'name'); end if;
  if s.locked_until is not null and s.locked_until > now() then
    return json_build_object('ok', false, 'error', 'locked');
  end if;
  if p_pin is null or s.pin_hash is null or s.pin_hash <> crypt(p_pin, s.pin_hash) then
    update public.portal_students set
      fails = case when coalesce(fails, 0) + 1 >= 5 then 0 else coalesce(fails, 0) + 1 end,
      locked_until = case when coalesce(fails, 0) + 1 >= 5 then now() + interval '5 minutes' else locked_until end
      where id = s.id;
    return json_build_object('ok', false, 'error', 'pin');
  end if;
  update public.portal_students set fails = 0, locked_until = null where id = s.id;
  pid := public._sketch_program_id();
  if pid is null or not (pid = any(coalesce(s.programs, '{}'::uuid[]))) then
    return json_build_object('ok', false, 'error', 'access');
  end if;
  delete from public.sketchbook_sessions where last_seen < now() - interval '2 days';
  insert into public.sketchbook_sessions(student_id) values (s.id) returning token into tok;
  select data, updated_at, username into r from public.sketchbook_students where student_id = s.id;
  return json_build_object('ok', true, 'token', tok, 'id', s.id, 'name', s.name,
                           'data', r.data, 'updated_at', r.updated_at, 'legacy', r.username);
end $$;

create or replace function public.sketch_save(p_token uuid, p_data jsonb) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare sid uuid;
begin
  select student_id into sid from public.sketchbook_sessions
    where token = p_token and last_seen > now() - interval '24 hours';
  if sid is null or not exists (select 1 from public.portal_students where id = sid) then
    return json_build_object('ok', false, 'error', 'session');
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 2000000 then
    return json_build_object('ok', false, 'error', 'data');
  end if;
  update public.sketchbook_sessions set last_seen = now() where token = p_token;
  insert into public.sketchbook_students(username, student_id, data, updated_at)
    values (sid::text, sid, p_data, now())
    on conflict (student_id) do update set data = excluded.data, updated_at = now();
  return json_build_object('ok', true);
end $$;

create or replace function public.sketch_signout(p_token uuid) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from public.sketchbook_sessions where token = p_token;
  return json_build_object('ok', true);
end $$;

------------------------------------------------------------------------------------------------
-- 5. Teacher functions (each one checks the portal teacher password)
------------------------------------------------------------------------------------------------
create or replace function public.sketch_admin_check(p_pass text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  return p_pass is not null and public._portal_is_admin(p_pass);
end $$;

-- Every portal student, the programs list, and each student's Sketchbook progress.
create or replace function public.sketch_admin_list(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._sketch_admin(p_pass);
  return json_build_object(
    'sketch_id', public._sketch_program_id(),
    'programs', (select coalesce(json_agg(json_build_object('id', p.id, 'name', p.name, 'icon', p.icon)
                   order by p.sort, p.name), '[]'::json) from public.portal_programs p),
    'students', (select coalesce(json_agg(json_build_object(
                   'id', s.id, 'name', s.name, 'programs', coalesce(s.programs, '{}'::uuid[]),
                   'locked', (s.locked_until is not null and s.locked_until > now()),
                   'data', k.data, 'updated_at', k.updated_at) order by lower(s.name)), '[]'::json)
                 from public.portal_students s
                 left join public.sketchbook_students k on k.student_id = s.id));
end $$;

-- Teacher changes a student's Sketchbook progress (for example "Open the next unit").
create or replace function public.sketch_admin_save(p_pass text, p_id uuid, p_data jsonb) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare nm text;
begin
  perform public._sketch_admin(p_pass);
  select name into nm from public.portal_students where id = p_id;
  if nm is null then raise exception 'That student is not on the list.'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Nothing to save.'; end if;
  insert into public.sketchbook_students(username, student_id, data, updated_at)
    values (p_id::text, p_id, p_data, now())
    on conflict (student_id) do update set data = excluded.data, updated_at = now();
  return json_build_object('ok', true);
end $$;

-- Add a student (portal and Sketchbook share this list).
create or replace function public.portal_add_student(p_pass text, p_first text, p_last text, p_pin text, p_programs uuid[])
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare nm text; nid uuid := gen_random_uuid();
begin
  perform public._sketch_admin(p_pass);
  nm := regexp_replace(trim(coalesce(p_first, '') || ' ' || coalesce(p_last, '')), '\s+', ' ', 'g');
  if trim(coalesce(p_first, '')) = '' then raise exception 'Type the first name.'; end if;
  if trim(coalesce(p_last, '')) = '' then raise exception 'Type the last name.'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then raise exception 'The code must be exactly 4 digits.'; end if;
  if exists (select 1 from public.portal_students where public._sketch_norm(name) = public._sketch_norm(nm)) then
    raise exception '% is already on the list.', nm;
  end if;
  insert into public.portal_students(id, name, pin_hash, programs, fails)
    values (nid, nm, crypt(p_pin, gen_salt('bf')),
            array(select distinct x from unnest(coalesce(p_programs, '{}'::uuid[])) x
                  where x in (select id from public.portal_programs)), 0);
  return json_build_object('ok', true, 'id', nid, 'name', nm);
end $$;

-- Set a new 4-digit code (also unlocks the student).
create or replace function public.portal_set_code(p_pass text, p_id uuid, p_pin text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._sketch_admin(p_pass);
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then raise exception 'The code must be exactly 4 digits.'; end if;
  update public.portal_students set pin_hash = crypt(p_pin, gen_salt('bf')), fails = 0, locked_until = null
    where id = p_id;
  if not found then raise exception 'That student is not on the list.'; end if;
  return json_build_object('ok', true);
end $$;

grant execute on function public.sketch_login(text, text) to anon, authenticated;
grant execute on function public.sketch_save(uuid, jsonb) to anon, authenticated;
grant execute on function public.sketch_signout(uuid) to anon, authenticated;
grant execute on function public.sketch_admin_check(text) to anon, authenticated;
grant execute on function public.sketch_admin_list(text) to anon, authenticated;
grant execute on function public.sketch_admin_save(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.portal_add_student(text, text, text, text, uuid[]) to anon, authenticated;
grant execute on function public.portal_set_code(text, uuid, text) to anon, authenticated;

------------------------------------------------------------------------------------------------
-- 6. Move existing Sketchbook students onto the portal list (keeps all progress and their codes)
------------------------------------------------------------------------------------------------
drop table if exists pg_temp.sketch_report;
create temp table sketch_report(student text, result text);

do $$
declare
  pid uuid; r record; nm text; code text; i int; sid uuid;
begin
  perform set_config('search_path', 'public, extensions', true);

  -- Sketchbook button on the portal
  pid := public._sketch_program_id();
  if pid is null then
    pid := gen_random_uuid();
    insert into public.portal_programs(id, name, url, icon, sort)
      values (pid, 'Sketchbook', 'https://ydtschool.github.io/PORTAL/sketchbook/', '🎨',
              coalesce((select max(sort) from public.portal_programs), 0) + 1);
    insert into sketch_report values ('(portal)', 'Added the Sketchbook button to the portal');
  end if;

  -- Every existing Sketchbook student becomes a NEW portal student. Nobody is linked by name.
  for r in select * from public.sketchbook_students where student_id is null loop
    nm := regexp_replace(trim(coalesce(nullif(r.data->>'name', ''), r.username)), '\s+', ' ', 'g');
    sid := null;
    if r.username = 'chavi' then
      nm := 'Chavi G.';   -- Chavi Greenes, not the portal's Chavi
      -- If the teacher already added "Chavi G." on the portal (and she has no Sketchbook progress yet), use that student.
      select p.id into sid from public.portal_students p
        where public._sketch_norm(p.name) = 'chavi g'
          and not exists (select 1 from public.sketchbook_students k where k.student_id = p.id) limit 1;
    end if;
    if sid is not null then
      update public.portal_students set programs = case when pid = any(coalesce(programs, '{}'::uuid[])) then programs
             else array_append(coalesce(programs, '{}'::uuid[]), pid) end where id = sid;
      update public.sketchbook_students set student_id = sid, pin = null,
             data = jsonb_set(data, '{name}', to_jsonb((select name from public.portal_students where id = sid)))
        where username = r.username;
      insert into sketch_report values ('Chavi G.', 'Her Sketchbook progress is now on the "Chavi G." you added. She uses the code you gave her there.');
      continue;
    end if;
    if exists (select 1 from public.portal_students where public._sketch_norm(name) = public._sketch_norm(nm)) then
      nm := nm || ' (Sketchbook)';
    end if;
    -- Find their existing Sketchbook code from the old hash, so it keeps working.
    code := null;
    if r.pin is not null then
      for i in 0..9999 loop
        if encode(digest('sketchbook|' || r.username || '|' || lpad(i::text, 4, '0'), 'sha256'), 'hex') = r.pin then
          code := lpad(i::text, 4, '0'); exit;
        end if;
      end loop;
    end if;
    sid := gen_random_uuid();
    insert into public.portal_students(id, name, pin_hash, programs, fails)
      values (sid, nm, case when code is null then null else crypt(code, gen_salt('bf')) end, array[pid], 0);
    update public.sketchbook_students
      set student_id = sid, pin = null, data = jsonb_set(data, '{name}', to_jsonb(nm))
      where username = r.username;
    insert into sketch_report values (nm, case when code is null
      then 'New portal student with Sketchbook. Could not read the old code: use Set a new code.'
      else 'New portal student with Sketchbook and all progress. Keeps the same code as before.' end);
  end loop;

  if not exists (select 1 from sketch_report) then
    insert into sketch_report values ('(everyone)', 'Already set up. Nothing needed to move.');
  end if;

  -- No old code hashes are kept.
  update public.sketchbook_students set pin = null where pin is not null;
end $$;

select student, result from sketch_report;
