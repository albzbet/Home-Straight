-- homestr8 0002: admins, editable content (lessons, meditations, crisis words), media uploads and the dashboard.
-- Run after 0001, in Supabase > SQL Editor > New snippet > Run. Safe to run again.
--
-- To make yourself an admin (after you've signed in to the app once), run this with your own sign-in email:
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com' on conflict do nothing;

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.hs_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke execute on function public.hs_is_admin() from public, anon;
grant execute on function public.hs_is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Content. One row per piece: 'weeks', 'lesson:1' ... 'lesson:56', 'meditations', 'safety'.
-- Anything not in here falls back to the copy built into the app.
-- ---------------------------------------------------------------------------
create table if not exists public.content (
  key text primary key check (key ~ '^(weeks|meditations|safety|lesson:([1-9]|[1-4][0-9]|5[0-6]))$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
-- Lessons go up to day 56 (8 weeks): harmless if the table was made with this limit already.
alter table public.content drop constraint if exists content_key_check;
alter table public.content add constraint content_key_check
  check (key ~ '^(weeks|meditations|safety|lesson:([1-9]|[1-4][0-9]|5[0-6]))$');
alter table public.content enable row level security;

-- Everyone (signed in or not) reads the content: lessons aren't private.
create or replace function public.hs_content() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.content
$$;
grant execute on function public.hs_content() to anon, authenticated;

-- Admins save one or more pieces at once. items: { "lesson:3": {...}, "weeks": [...] }
create or replace function public.hs_admin_save_content(items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  k text;
  v jsonb;
begin
  if not public.hs_is_admin() then raise exception 'admins only'; end if;
  for k, v in select * from jsonb_each(items) loop
    insert into public.content (key, value, updated_at, updated_by) values (k, v, now(), auth.uid())
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  end loop;
end $$;
revoke execute on function public.hs_admin_save_content(jsonb) from public, anon;
grant execute on function public.hs_admin_save_content(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Media: lesson videos, audio and meditations. Anyone can play them; only admins can upload or remove them.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.hs_is_admin());
drop policy if exists "admins change media" on storage.objects;
create policy "admins change media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.hs_is_admin());
drop policy if exists "admins remove media" on storage.objects;
create policy "admins remove media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.hs_is_admin());

-- ---------------------------------------------------------------------------
-- Anonymous counts for things that happen before anyone has an account (trying Day 1) or that aren't saved
-- (opening Urge SOS). Just a number per day: no user, no device, nothing that identifies anyone.
-- ---------------------------------------------------------------------------
create table if not exists public.usage_counts (
  day date not null default current_date,
  name text not null check (name in ('guest_onboarded', 'guest_day1', 'sos_opened')),
  count int not null default 0,
  primary key (day, name)
);
alter table public.usage_counts enable row level security;

create or replace function public.hs_count(name text) returns void
language sql security definer set search_path = public as $$
  insert into public.usage_counts (day, name, count) values (current_date, $1, 1)
  on conflict (day, name) do update set count = usage_counts.count + 1
$$;
grant execute on function public.hs_count(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- The dashboard: totals and averages only, never anyone's own answers. Averages of the questionnaire and check-ins
-- need at least 5 people behind them, so no one can be picked out while numbers are small.
-- ---------------------------------------------------------------------------
create or replace function public.hs_admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  result jsonb;
  min_group constant int := 5;
begin
  if not public.hs_is_admin() then raise exception 'admins only'; end if;

  with reached as (
    select member_id, max(day) as furthest from public.day_progress group by member_id
  ), pairs as (
    select b.member_id,
      (select sum(x) from unnest(b.answers) x) as before_total,
      (select sum(x) from unnest(e.answers) x) as after_total
    from public.questionnaires b
    join lateral (
      select answers from public.questionnaires e where e.member_id = b.member_id and e.kind = 'end' order by taken_at desc limit 1
    ) e on true
    where b.kind = 'baseline'
  ), recent_checkins as (
    select mood, urge from public.day_progress where completed_at > now() - interval '30 days'
    union all
    select mood, urge from public.daily_checkins where local_date > current_date - 30
  )
  select jsonb_build_object(
    'members', (select count(*) from public.members where onboarded_at is not null),
    'tryFirst', jsonb_build_object(
      'onboarded', (select coalesce(sum(count), 0) from public.usage_counts where name = 'guest_onboarded'),
      'day1', (select coalesce(sum(count), 0) from public.usage_counts where name = 'guest_day1')),
    'funnel', jsonb_build_object(
      'day1', (select count(*) from reached where furthest >= 1),
      'day3', (select count(*) from reached where furthest >= 3),
      'day7', (select count(*) from reached where furthest >= 7),
      'week3', (select count(*) from reached where furthest >= 21),
      'week8', (select count(*) from reached where furthest >= 56)),
    'sos', jsonb_build_object(
      'opened', (select coalesce(sum(count), 0) from public.usage_counts where name = 'sos_opened'),
      'opened30', (select coalesce(sum(count), 0) from public.usage_counts where name = 'sos_opened' and day > current_date - 30),
      'logged', (select count(*) from public.urge_logs),
      'handled', (select count(*) from public.urge_logs where passed in ('yes', 'easing'))),
    'checkins30', case when (select count(*) from recent_checkins) >= min_group then jsonb_build_object(
      'count', (select count(*) from recent_checkins),
      'mood', (select round(avg(mood), 1) from recent_checkins),
      'urge', (select round(avg(urge), 1) from recent_checkins)) else null end,
    'questionnaire', case when (select count(*) from pairs) >= min_group then jsonb_build_object(
      'people', (select count(*) from pairs),
      'before', (select round(avg(before_total), 1) from pairs),
      'after', (select round(avg(after_total), 1) from pairs)) else jsonb_build_object('people', (select count(*) from pairs)) end,
    'minGroup', min_group
  ) into result;
  return result;
end $$;
revoke execute on function public.hs_admin_stats() from public, anon;
grant execute on function public.hs_admin_stats() to authenticated;
