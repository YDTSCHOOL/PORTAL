-- APEX KARTS: race settings the teacher can change for each student.
-- Run this whole file ONCE in the Supabase SQL Editor (SCHOOL project). Safe to run again.
-- It only adds a new table and three functions that start with stage_. Nothing else changes.

create table if not exists public.stage_cfg(
  student_id text primary key,
  cfg jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now());
alter table public.stage_cfg enable row level security;

create or replace function public.stage_get_cfg(p_token uuid) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare sid text; c jsonb;
begin
  select student_id into sid from public.stage_sessions where token = p_token and last_seen > now() - interval '12 hours';
  if sid is null then return json_build_object('ok',false,'error','session'); end if;
  select cfg into c from public.stage_cfg where student_id = sid;
  return json_build_object('ok',true,'cfg',coalesce(c,'{}'::jsonb));
end $$;

create or replace function public.stage_admin_cfgs(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  return json_build_object('ok',true,'cfgs',(select coalesce(json_object_agg(student_id, cfg),'{}'::json) from public.stage_cfg));
end $$;

create or replace function public.stage_admin_set_cfg(p_pass text, p_student text, p_cfg jsonb) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._portal_is_admin(p_pass) then return json_build_object('ok',false,'error','pass'); end if;
  insert into public.stage_cfg(student_id, cfg, updated_at) values (p_student, p_cfg, now())
    on conflict (student_id) do update set cfg = excluded.cfg, updated_at = now();
  insert into public.stage_log(student_id, event, detail)
    values (p_student, 'teacher', left('Teacher changed race settings: ' || coalesce(p_cfg->>'q','1') || ' per pit stop, ' || coalesce(p_cfg->>'laps','4') || ' laps, ' || coalesce(p_cfg->>'len','medium') || ' laps, driving help ' || case when coalesce((p_cfg->>'assist')::boolean, true) then 'on' else 'off' end, 400));
  return json_build_object('ok',true);
end $$;

grant execute on function public.stage_get_cfg(uuid) to anon, authenticated;
grant execute on function public.stage_admin_cfgs(text) to anon, authenticated;
grant execute on function public.stage_admin_set_cfg(text,text,jsonb) to anon, authenticated;
