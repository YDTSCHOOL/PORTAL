-- COMPOUND finance course: setup for the SCHOOL Supabase project (version 2.7).
-- Run the whole file. If you ran an earlier version, run this one too: it only adds what is new.
-- Adds new tables and functions starting with finance_. It does not change the portal's tables,
-- except to count wrong PINs the same way the portal does.
-- Safe to run more than once.

create table if not exists public.finance_progress(
  student_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now());
create table if not exists public.finance_sessions(
  token uuid primary key default gen_random_uuid(),
  student_id text not null,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now());
create table if not exists public.finance_log(
  id bigserial primary key,
  student_id text not null,
  at timestamptz not null default now(),
  event text,
  detail text);
create table if not exists public.finance_settings(
  id int primary key default 1 check (id = 1),
  lock_on boolean not null default true,
  close_time text not null default '15:10',
  open_time text not null default '16:15',
  tz text not null default 'America/Detroit',
  updated_at timestamptz not null default now());
insert into public.finance_settings(id) values (1) on conflict (id) do nothing;
alter table public.finance_settings add column if not exists teacher_email text;
alter table public.finance_settings add column if not exists resend_key text;
alter table public.finance_settings add column if not exists from_email text not null default 'onboarding@resend.dev';
do $$ begin create extension if not exists pg_net; exception when others then raise notice 'Turn on pg_net under Database > Extensions to send emails'; end $$;
alter table public.finance_settings enable row level security;
alter table public.finance_progress enable row level security;
alter table public.finance_sessions enable row level security;
alter table public.finance_log enable row level security;

create or replace function public._finance_mins(t text) returns int language sql immutable as $$
  select split_part(t,':',1)::int*60 + split_part(t,':',2)::int $$;

create or replace function public._finance_is_closed() returns boolean
language plpgsql security definer set search_path = public as $$
declare cfg record; nm int; c int; o int;
begin
  select * into cfg from public.finance_settings where id = 1;
  if not found or not cfg.lock_on then return false; end if;
  nm := extract(hour from (now() at time zone cfg.tz))::int*60 + extract(minute from (now() at time zone cfg.tz))::int;
  c := public._finance_mins(cfg.close_time); o := public._finance_mins(cfg.open_time);
  if c < o then return nm >= c and nm < o; end if;
  if c > o then return nm >= c or nm < o; end if;
  return false;
end $$;

create or replace function public.finance_get_settings() returns json
language plpgsql security definer set search_path = public as $$
declare cfg record;
begin
  select * into cfg from public.finance_settings where id = 1;
  return json_build_object('ok',true,'lock_on',cfg.lock_on,'close_time',cfg.close_time,'open_time',cfg.open_time,
    'now_min', extract(hour from (now() at time zone cfg.tz))::int*60 + extract(minute from (now() at time zone cfg.tz))::int,
    'closed', public._finance_is_closed());
end $$;

create or replace function public.finance_admin_set_settings(p_pass text, p_lock_on boolean, p_close text, p_open text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  if p_close !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or p_open !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    return json_build_object('ok',false,'error','time'); end if;
  update public.finance_settings set lock_on = p_lock_on, close_time = p_close, open_time = p_open, updated_at = now() where id = 1;
  return json_build_object('ok',true);
end $$;

create or replace function public.finance_login(p_name text, p_pin text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare s record; tok uuid; st jsonb;
begin
  select * into s from public.portal_students where lower(trim(name)) = lower(trim(p_name)) limit 1;
  if not found then return json_build_object('ok',false,'error','name'); end if;
  if public._finance_is_closed() then return json_build_object('ok',false,'error','closed'); end if;
  if s.locked_until is not null and s.locked_until > now() then return json_build_object('ok',false,'error','locked'); end if;
  if s.pin_hash is null or s.pin_hash <> crypt(p_pin, s.pin_hash) then
    update public.portal_students set
      fails = case when coalesce(fails,0)+1 >= 5 then 0 else coalesce(fails,0)+1 end,
      locked_until = case when coalesce(fails,0)+1 >= 5 then now() + interval '5 minutes' else locked_until end
      where id = s.id;
    return json_build_object('ok',false,'error','pin');
  end if;
  update public.portal_students set fails = 0, locked_until = null where id = s.id;
  delete from public.finance_sessions where last_seen < now() - interval '2 days';
  insert into public.finance_sessions(student_id) values (s.id::text) returning token into tok;
  select state into st from public.finance_progress where student_id = s.id::text;
  insert into public.finance_log(student_id, event) values (s.id::text, 'sign in');
  return json_build_object('ok',true,'token',tok,'name',s.name,'state',coalesce(st,'{}'::jsonb));
end $$;

create or replace function public.finance_save(p_token uuid, p_state jsonb, p_event text default null, p_detail text default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare sid text;
begin
  select student_id into sid from public.finance_sessions where token = p_token and last_seen > now() - interval '12 hours';
  if sid is null then return json_build_object('ok',false,'error','session'); end if;
  update public.finance_sessions set last_seen = now() where token = p_token;
  if p_state is not null then
    insert into public.finance_progress(student_id, state, updated_at) values (sid, p_state, now())
      on conflict (student_id) do update set state = excluded.state, updated_at = now();
  end if;
  if p_event is not null then
    insert into public.finance_log(student_id, event, detail) values (sid, p_event, p_detail);
  end if;
  return json_build_object('ok',true);
end $$;

create or replace function public.finance_signout(p_token uuid) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare sid text;
begin
  select student_id into sid from public.finance_sessions where token = p_token;
  if sid is not null then
    insert into public.finance_log(student_id, event) values (sid, 'sign out');
    delete from public.finance_sessions where token = p_token;
  end if;
  return json_build_object('ok',true);
end $$;
-- END OF PART 1 --

create or replace function public.finance_admin_data(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  return json_build_object('ok',true,
    'students', (select coalesce(json_agg(x order by x.name),'[]'::json) from (
        select s.id::text as id, s.name, p.state, p.updated_at,
               (select max(l.at) from public.finance_log l where l.student_id = s.id::text) as last_seen
        from public.portal_students s join public.finance_progress p on p.student_id = s.id::text) x),
    'log', (select coalesce(json_agg(y),'[]'::json) from (
        select l.at, l.event, l.detail, s.name from public.finance_log l
        left join public.portal_students s on s.id::text = l.student_id
        order by l.at desc limit 80) y));
end $$;

create or replace function public.finance_admin_set_week(p_pass text, p_student text, p_week int) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  insert into public.finance_progress(student_id, state) values (p_student, jsonb_build_object('wk', p_week))
    on conflict (student_id) do update set state = jsonb_set(public.finance_progress.state, '{wk}', to_jsonb(p_week)), updated_at = now();
  insert into public.finance_log(student_id, event, detail) values (p_student, 'teacher', 'Set to week ' || p_week);
  return json_build_object('ok',true);
end $$;

create or replace function public.finance_admin_reset(p_pass text, p_student text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  insert into public.finance_progress(student_id, state) values (p_student, '{}'::jsonb)
    on conflict (student_id) do update set state = '{}'::jsonb, updated_at = now();
  insert into public.finance_log(student_id, event, detail) values (p_student, 'teacher', 'Progress reset');
  return json_build_object('ok',true);
end $$;

grant execute on function public.finance_login(text,text) to anon, authenticated;
grant execute on function public.finance_save(uuid,jsonb,text,text) to anon, authenticated;
grant execute on function public.finance_signout(uuid) to anon, authenticated;
grant execute on function public.finance_admin_data(text) to anon, authenticated;
grant execute on function public.finance_admin_set_week(text,text,int) to anon, authenticated;
grant execute on function public.finance_admin_reset(text,text) to anon, authenticated;
grant execute on function public.finance_get_settings() to anon, authenticated;
grant execute on function public.finance_admin_set_settings(text,boolean,text,text) to anon, authenticated;
-- END OF PART 2 --

create or replace function public._finance_send_email(p_subject text, p_text text) returns boolean
language plpgsql security definer set search_path = public as $$
declare cfg record;
begin
  select * into cfg from public.finance_settings where id = 1;
  if cfg.resend_key is null or cfg.teacher_email is null then return false; end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    body := jsonb_build_object('from', 'Compound <' || cfg.from_email || '>', 'to', jsonb_build_array(cfg.teacher_email), 'subject', p_subject, 'text', p_text),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || cfg.resend_key));
  return true;
exception when others then return false;
end $$;

create table if not exists public.finance_messages(
  id bigserial primary key,
  student_id text not null,
  created_at timestamptz not null default now(),
  kind text not null,            -- 'help' (from the student) or 'reply' (from the teacher)
  where_text text,
  body text,                     -- what the student is allowed to see
  teacher_body text,             -- teacher-only copy, including the answer
  reply_to bigint,
  read_at timestamptz);
alter table public.finance_messages enable row level security;
drop function if exists public.finance_help_request(uuid,text,text);

create or replace function public.finance_help_request(p_token uuid, p_where text, p_message text, p_student_view text, p_site text) returns json
language plpgsql security definer set search_path = public as $$
declare sid text; nm text; cnt int; sent boolean; mid bigint; link text;
begin
  select student_id into sid from public.finance_sessions where token = p_token and last_seen > now() - interval '12 hours';
  if sid is null then return json_build_object('ok',false,'error','session'); end if;
  select count(*) into cnt from public.finance_log where student_id = sid and event = 'help request' and at > now() - interval '24 hours';
  if cnt >= 5 then return json_build_object('ok',false,'error','limit'); end if;
  select name into nm from public.portal_students where id::text = sid;
  insert into public.finance_log(student_id, event, detail) values (sid, 'help request', left(p_where, 200));
  insert into public.finance_messages(student_id, kind, where_text, body, teacher_body)
    values (sid, 'help', left(p_where,200), left(coalesce(p_student_view,''),2000), left(coalesce(p_message,''),6000)) returning id into mid;
  link := case when p_site ~ '^https://[^ ]+$' then p_site || '#reply=' || mid else null end;
  sent := public._finance_send_email('Compound: ' || coalesce(nm,'your student') || ' needs help (' || left(p_where,120) || ')',
    'Student: ' || coalesce(nm,'') || E'\n' || 'Where: ' || left(p_where,200) || E'\n' || 'Sent: ' || to_char(now() at time zone 'America/Detroit','Mon DD, HH12:MI AM') || E'\n\n'
    || coalesce('REPLY TO HIM HERE: ' || link || E'\n(He will see your reply the next time he signs in.)\n\n', 'Reply from the Teacher view in Compound.' || E'\n\n')
    || left(coalesce(p_message,''), 6000));
  return json_build_object('ok',true,'emailed',sent,'id',mid);
end $$;

create or replace function public.finance_get_messages(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare sid text;
begin
  select student_id into sid from public.finance_sessions where token = p_token and last_seen > now() - interval '12 hours';
  if sid is null then return json_build_object('ok',false,'error','session'); end if;
  return json_build_object('ok',true,
    'unread',(select count(*) from public.finance_messages where student_id = sid and kind = 'reply' and read_at is null),
    'messages',(select coalesce(json_agg(m order by m.created_at desc),'[]'::json) from (
      select id, kind, created_at, where_text, body, reply_to, read_at from public.finance_messages
      where student_id = sid order by created_at desc limit 40) m));
end $$;

create or replace function public.finance_mark_read(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare sid text; n int;
begin
  select student_id into sid from public.finance_sessions where token = p_token and last_seen > now() - interval '12 hours';
  if sid is null then return json_build_object('ok',false,'error','session'); end if;
  update public.finance_messages set read_at = now() where student_id = sid and kind = 'reply' and read_at is null;
  get diagnostics n = row_count;
  if n > 0 then insert into public.finance_log(student_id, event, detail) values (sid, 'read reply', 'Read ' || n || ' message' || case when n > 1 then 's' else '' end || ' from the teacher'); end if;
  return json_build_object('ok',true);
end $$;

create or replace function public.finance_admin_messages(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  return json_build_object('ok',true,'messages',(select coalesce(json_agg(m order by m.created_at desc),'[]'::json) from (
    select f.id, f.student_id, s.name, f.kind, f.created_at, f.where_text, f.body, f.teacher_body, f.reply_to, f.read_at
    from public.finance_messages f left join public.portal_students s on s.id::text = f.student_id
    order by f.created_at desc limit 80) m));
end $$;

create or replace function public.finance_admin_reply(p_pass text, p_id bigint, p_body text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare sid text;
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  if coalesce(trim(p_body),'') = '' then return json_build_object('ok',false,'error','empty'); end if;
  select student_id into sid from public.finance_messages where id = p_id;
  if sid is null then return json_build_object('ok',false,'error','missing'); end if;
  insert into public.finance_messages(student_id, kind, body, reply_to) values (sid, 'reply', left(trim(p_body),3000), p_id);
  insert into public.finance_log(student_id, event, detail) values (sid, 'teacher reply', 'Teacher replied to a help request');
  return json_build_object('ok',true);
end $$;

create or replace function public.finance_admin_email_status(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare cfg record;
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  select * into cfg from public.finance_settings where id = 1;
  return json_build_object('ok',true,'teacher_email',cfg.teacher_email,'key_set',cfg.resend_key is not null,'from_email',cfg.from_email);
end $$;

create or replace function public.finance_admin_set_email(p_pass text, p_email text, p_key text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  update public.finance_settings set teacher_email = nullif(trim(p_email),''),
    resend_key = coalesce(nullif(trim(p_key),''), resend_key), updated_at = now() where id = 1;
  return json_build_object('ok',true);
end $$;

create or replace function public.finance_admin_test_email(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  return json_build_object('ok',true,'sent',public._finance_send_email('Compound: test email', 'This is a test from Compound. Help requests from your student will arrive at this address.'));
end $$;

grant execute on function public.finance_help_request(uuid,text,text,text,text) to anon, authenticated;
grant execute on function public.finance_get_messages(uuid) to anon, authenticated;
grant execute on function public.finance_mark_read(uuid) to anon, authenticated;
grant execute on function public.finance_admin_messages(text) to anon, authenticated;
grant execute on function public.finance_admin_reply(text,bigint,text) to anon, authenticated;
grant execute on function public.finance_admin_email_status(text) to anon, authenticated;
grant execute on function public.finance_admin_set_email(text,text,text) to anon, authenticated;
grant execute on function public.finance_admin_test_email(text) to anon, authenticated;
revoke execute on function public._finance_send_email(text,text) from public, anon, authenticated;
-- END OF PART 3 --
