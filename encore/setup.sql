-- ENCORE: sound and stage company. Setup for the SCHOOL Supabase project (version 1.0).
-- Run the whole file in the SQL Editor. Safe to run more than once.
-- Adds new tables and functions starting with stage_. It does not change any other program's tables,
-- except to count wrong PINs the same way the portal does.
-- Sign-in uses the portal's students and PINs. The teacher password is the portal's.

create table if not exists public.stage_progress(
  student_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now());
create table if not exists public.stage_sessions(
  token uuid primary key default gen_random_uuid(),
  student_id text not null,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now());
create table if not exists public.stage_log(
  id bigserial primary key,
  student_id text not null,
  at timestamptz not null default now(),
  event text,
  detail text);
create table if not exists public.stage_settings(
  id int primary key default 1 check (id = 1),
  lock_on boolean not null default false,
  close_time text not null default '15:10',
  open_time text not null default '16:15',
  tz text not null default 'America/Detroit',
  updated_at timestamptz not null default now());
insert into public.stage_settings(id) values (1) on conflict (id) do nothing;
alter table public.stage_progress enable row level security;
alter table public.stage_sessions enable row level security;
alter table public.stage_log enable row level security;
alter table public.stage_settings enable row level security;
create index if not exists stage_log_student_at on public.stage_log(student_id, at desc);
create index if not exists stage_log_at on public.stage_log(at desc);

create or replace function public._stage_mins(t text) returns int language sql immutable as $$
  select split_part(t,':',1)::int*60 + split_part(t,':',2)::int $$;

create or replace function public._stage_is_closed() returns boolean
language plpgsql security definer set search_path = public as $$
declare cfg record; nm int; c int; o int;
begin
  select * into cfg from public.stage_settings where id = 1;
  if not found or not cfg.lock_on then return false; end if;
  nm := extract(hour from (now() at time zone cfg.tz))::int*60 + extract(minute from (now() at time zone cfg.tz))::int;
  c := public._stage_mins(cfg.close_time); o := public._stage_mins(cfg.open_time);
  if c < o then return nm >= c and nm < o; end if;
  if c > o then return nm >= c or nm < o; end if;
  return false;
end $$;

create or replace function public.stage_get_settings() returns json
language plpgsql security definer set search_path = public as $$
declare cfg record;
begin
  select * into cfg from public.stage_settings where id = 1;
  return json_build_object('ok',true,'lock_on',cfg.lock_on,'close_time',cfg.close_time,'open_time',cfg.open_time,
    'now_min', extract(hour from (now() at time zone cfg.tz))::int*60 + extract(minute from (now() at time zone cfg.tz))::int,
    'closed', public._stage_is_closed());
end $$;

create or replace function public.stage_admin_set_settings(p_pass text, p_lock_on boolean, p_close text, p_open text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  if p_close !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or p_open !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    return json_build_object('ok',false,'error','time'); end if;
  update public.stage_settings set lock_on = p_lock_on, close_time = p_close, open_time = p_open, updated_at = now() where id = 1;
  return json_build_object('ok',true);
end $$;

create or replace function public.stage_login(p_name text, p_pin text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare s record; tok uuid; st jsonb;
begin
  select * into s from public.portal_students where lower(trim(name)) = lower(trim(p_name)) limit 1;
  if not found then return json_build_object('ok',false,'error','name'); end if;
  if public._stage_is_closed() then return json_build_object('ok',false,'error','closed'); end if;
  if s.locked_until is not null and s.locked_until > now() then return json_build_object('ok',false,'error','locked'); end if;
  if s.pin_hash is null or s.pin_hash <> crypt(p_pin, s.pin_hash) then
    update public.portal_students set
      fails = case when coalesce(fails,0)+1 >= 5 then 0 else coalesce(fails,0)+1 end,
      locked_until = case when coalesce(fails,0)+1 >= 5 then now() + interval '5 minutes' else locked_until end
      where id = s.id;
    return json_build_object('ok',false,'error','pin');
  end if;
  update public.portal_students set fails = 0, locked_until = null where id = s.id;
  delete from public.stage_sessions where last_seen < now() - interval '2 days';
  insert into public.stage_sessions(student_id) values (s.id::text) returning token into tok;
  select state into st from public.stage_progress where student_id = s.id::text;
  insert into public.stage_log(student_id, event, detail) values (s.id::text, 'sign in', 'Signed in');
  return json_build_object('ok',true,'token',tok,'name',s.name,'state',coalesce(st,'{}'::jsonb));
end $$;

create or replace function public.stage_save(p_token uuid, p_state jsonb, p_events jsonb default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare sid text;
begin
  select student_id into sid from public.stage_sessions where token = p_token and last_seen > now() - interval '12 hours';
  if sid is null then return json_build_object('ok',false,'error','session'); end if;
  update public.stage_sessions set last_seen = now() where token = p_token;
  if p_state is not null and p_state ? 'skills' then
    insert into public.stage_progress(student_id, state, updated_at) values (sid, p_state, now())
      on conflict (student_id) do update set state = excluded.state, updated_at = now();
  end if;
  if p_events is not null and jsonb_typeof(p_events) = 'array' then
    insert into public.stage_log(student_id, event, detail)
      select sid, left(x->>'e', 40), left(x->>'d', 400)
      from (select value as x from jsonb_array_elements(p_events) limit 50) t;
  end if;
  return json_build_object('ok',true);
end $$;

create or replace function public.stage_signout(p_token uuid) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare sid text;
begin
  select student_id into sid from public.stage_sessions where token = p_token;
  if sid is not null then
    insert into public.stage_log(student_id, event, detail) values (sid, 'sign out', 'Signed out');
    delete from public.stage_sessions where token = p_token;
  end if;
  return json_build_object('ok',true);
end $$;
-- END OF PART 1 --

create or replace function public.stage_admin_data(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  return json_build_object('ok',true,
    'students', (select coalesce(json_agg(x order by x.name),'[]'::json) from (
        select s.id::text as id, s.name, p.state, p.updated_at,
               (select max(l.at) from public.stage_log l where l.student_id = s.id::text) as last_seen
        from public.portal_students s join public.stage_progress p on p.student_id = s.id::text) x),
    'log', (select coalesce(json_agg(y),'[]'::json) from (
        select l.at, l.event, l.detail, s.name from public.stage_log l
        left join public.portal_students s on s.id::text = l.student_id
        order by l.at desc limit 300) y));
end $$;

create or replace function public.stage_admin_reset(p_pass text, p_student text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  insert into public.stage_progress(student_id, state) values (p_student, '{}'::jsonb)
    on conflict (student_id) do update set state = '{}'::jsonb, updated_at = now();
  insert into public.stage_log(student_id, event, detail) values (p_student, 'teacher', 'Teacher reset his progress');
  return json_build_object('ok',true);
end $$;

grant execute on function public.stage_login(text,text) to anon, authenticated;
grant execute on function public.stage_save(uuid,jsonb,jsonb) to anon, authenticated;
grant execute on function public.stage_signout(uuid) to anon, authenticated;
grant execute on function public.stage_get_settings() to anon, authenticated;
grant execute on function public.stage_admin_set_settings(text,boolean,text,text) to anon, authenticated;
grant execute on function public.stage_admin_data(text) to anon, authenticated;
grant execute on function public.stage_admin_reset(text,text) to anon, authenticated;
-- END OF PART 2 --
