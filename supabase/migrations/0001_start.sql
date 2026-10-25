-- Homestraight 0001: members and their program (onboarding answers, questionnaires, daily sessions).
-- Run once in Supabase > SQL Editor > New snippet > Run. Safe to run again.
--
-- Privacy design:
-- * The app can't read or write these tables directly (RLS on, no policies). Everything goes through the hs_* functions
--   below, which only ever touch the signed-in member's own rows.
-- * Anything a member writes in their own words (their why, what they're saving for, their plans, their buddy's email)
--   is encrypted with a key kept in Supabase Vault. It is never stored in plain text.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- The encryption key: made once, kept in Vault, never leaves the database.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'hs_data_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'hs_data_key', 'Encrypts what members write');
  end if;
end $$;

create or replace function private.enc(t text) returns bytea
language sql security definer set search_path = '' as $$
  select case when t is null or btrim(t) = '' then null
    else extensions.pgp_sym_encrypt(t, (select decrypted_secret from vault.decrypted_secrets where name = 'hs_data_key')) end
$$;

create or replace function private.dec(b bytea) returns text
language sql security definer set search_path = '' as $$
  select case when b is null then null
    else extensions.pgp_sym_decrypt(b, (select decrypted_secret from vault.decrypted_secrets where name = 'hs_data_key')) end
$$;

revoke execute on function private.enc(text), private.dec(bytea) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text check (char_length(nickname) between 2 and 24),
  adult_confirmed_at timestamptz,
  goal text check (goal in ('quit', 'cut_back', 'break')),
  gambling_types text[] not null default '{}' check (cardinality(gambling_types) <= 20),
  why_choices text[] not null default '{}' check (cardinality(why_choices) <= 20),
  why_text bytea, -- encrypted
  weekly_spend numeric(10, 2) check (weekly_spend between 0 and 1000000),
  saving_for bytea, -- encrypted
  saving_target numeric(10, 2) check (saving_target between 0 and 1000000),
  risky_times text[] not null default '{}' check (cardinality(risky_times) <= 20),
  payday text check (char_length(payday) <= 40),
  habit text check (char_length(habit) <= 80),
  reminder_time text check (reminder_time ~ '^\d{2}:\d{2}$'),
  buddy_email bytea, -- encrypted
  buddy_consent_at timestamptz,
  onboarded_at timestamptz,
  paused_since date, -- program on hold (no reminders); null = not paused
  paused_until date, -- null while paused = until they come back
  plan_notes bytea, -- encrypted: their own notes for the game plan
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Added after the first version of this file: harmless if the column is already there.
alter table public.members add column if not exists gambling_types text[] not null default '{}';
alter table public.members add column if not exists paused_since date;
alter table public.members add column if not exists paused_until date;
alter table public.members add column if not exists plan_notes bytea;

create table if not exists public.questionnaires (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  kind text not null check (kind in ('baseline', 'end')),
  answers smallint[] not null check (cardinality(answers) between 1 and 20),
  taken_at timestamptz not null default now()
);
create index if not exists questionnaires_member on public.questionnaires (member_id);

create table if not exists public.day_progress (
  member_id uuid not null references public.members (id) on delete cascade,
  day smallint not null check (day between 1 and 42),
  local_date date not null,
  completed_at timestamptz not null default now(),
  busy boolean not null default false,
  mood smallint check (mood between 1 and 5),
  urge smallint check (urge between 0 and 10),
  gambled boolean,
  amount numeric(10, 2) check (amount between 0 and 1000000),
  action bytea, -- encrypted
  slip_what bytea, -- encrypted: if they gambled, what was going on
  slip_different bytea, -- encrypted: what they'd do differently
  primary key (member_id, day)
);
alter table public.day_progress add column if not exists slip_what bytea;
alter table public.day_progress add column if not exists slip_different bytea;

-- Urge SOS uses, logged afterwards.
create table if not exists public.urge_logs (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  started_at timestamptz not null,
  seconds int not null check (seconds between 0 and 86400),
  triggers text[] not null default '{}' check (cardinality(triggers) <= 20),
  passed text not null check (passed in ('yes', 'easing', 'gambled')),
  helped text[] not null default '{}' check (cardinality(helped) <= 20),
  note bytea -- encrypted
);
create index if not exists urge_logs_member on public.urge_logs (member_id, started_at);

alter table public.members enable row level security;
alter table public.urge_logs enable row level security;
alter table public.questionnaires enable row level security;
alter table public.day_progress enable row level security;

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

-- Everything about the signed-in member, in the shape of ProgramState (lib/types.ts).
create or replace function public.hs_my_state() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nickname', m.nickname,
    'adultConfirmedAt', m.adult_confirmed_at,
    'planNotes', coalesce(private.dec(m.plan_notes), ''),
    'pause', case when m.paused_since is null then null else jsonb_build_object('since', m.paused_since, 'until', m.paused_until) end,
    'onboarding', case when m.onboarded_at is null then null else jsonb_build_object(
      'goal', m.goal,
      'gamblingTypes', to_jsonb(m.gambling_types),
      'whyChoices', to_jsonb(m.why_choices),
      'whyText', coalesce(private.dec(m.why_text), ''),
      'weeklySpend', m.weekly_spend,
      'savingFor', coalesce(private.dec(m.saving_for), ''),
      'savingTarget', m.saving_target,
      'riskyTimes', to_jsonb(m.risky_times),
      'payday', coalesce(m.payday, ''),
      'habit', coalesce(m.habit, ''),
      'reminderTime', coalesce(m.reminder_time, '07:30'),
      'buddyEmail', coalesce(private.dec(m.buddy_email), ''),
      'buddyConsent', m.buddy_consent_at is not null,
      'completedAt', m.onboarded_at) end,
    'questionnaires', coalesce((select jsonb_agg(jsonb_build_object('kind', q.kind, 'answers', to_jsonb(q.answers), 'takenAt', q.taken_at)
        order by q.taken_at) from public.questionnaires q where q.member_id = auth.uid()), '[]'::jsonb),
    'days', coalesce((select jsonb_agg(jsonb_build_object('day', d.day, 'localDate', d.local_date, 'completedAt', d.completed_at,
        'busy', d.busy, 'mood', d.mood, 'urge', d.urge, 'gambled', d.gambled, 'amount', d.amount,
        'action', coalesce(private.dec(d.action), ''), 'slipWhat', coalesce(private.dec(d.slip_what), ''),
        'slipDifferent', coalesce(private.dec(d.slip_different), '')) order by d.day) from public.day_progress d where d.member_id = auth.uid()), '[]'::jsonb),
    'urges', coalesce((select jsonb_agg(jsonb_build_object('at', u.started_at, 'seconds', u.seconds, 'triggers', to_jsonb(u.triggers),
        'passed', u.passed, 'helped', to_jsonb(u.helped), 'note', coalesce(private.dec(u.note), '')) order by u.started_at)
        from public.urge_logs u where u.member_id = auth.uid()), '[]'::jsonb))
  from (select auth.uid() as uid) me
  left join public.members m on m.id = me.uid
  where me.uid is not null
$$;

-- Nickname, 18+ confirmation and/or the onboarding answers. p: { nickname?, adultConfirmed?, onboarding? }
create or replace function public.hs_save_member(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  o jsonb := p -> 'onboarding';
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.members (id) values (uid) on conflict (id) do nothing;

  update public.members set
    nickname = case when p ? 'nickname' and nullif(btrim(p ->> 'nickname'), '') is not null then btrim(p ->> 'nickname') else nickname end,
    plan_notes = case when p ? 'planNotes' then private.enc(left(p ->> 'planNotes', 2000)) else plan_notes end,
    adult_confirmed_at = case when coalesce((p ->> 'adultConfirmed')::boolean, false) then coalesce(adult_confirmed_at, now()) else adult_confirmed_at end,
    updated_at = now()
  where id = uid;

  if o is not null and jsonb_typeof(o) = 'object' then
    update public.members set
      goal = o ->> 'goal',
      gambling_types = coalesce(array(select jsonb_array_elements_text(o -> 'gamblingTypes')), '{}'),
      why_choices = coalesce(array(select jsonb_array_elements_text(o -> 'whyChoices')), '{}'),
      why_text = private.enc(left(o ->> 'whyText', 300)),
      weekly_spend = (o ->> 'weeklySpend')::numeric,
      saving_for = private.enc(left(o ->> 'savingFor', 60)),
      saving_target = (o ->> 'savingTarget')::numeric,
      risky_times = coalesce(array(select jsonb_array_elements_text(o -> 'riskyTimes')), '{}'),
      payday = nullif(o ->> 'payday', ''),
      habit = nullif(left(o ->> 'habit', 80), ''),
      reminder_time = coalesce(nullif(o ->> 'reminderTime', ''), '07:30'),
      buddy_email = private.enc(left(o ->> 'buddyEmail', 200)),
      buddy_consent_at = case when coalesce((o ->> 'buddyConsent')::boolean, false) and coalesce(o ->> 'buddyEmail', '') <> ''
        then coalesce(buddy_consent_at, now()) else null end,
      onboarded_at = coalesce(onboarded_at, now()),
      updated_at = now()
    where id = uid;
  end if;
end $$;

-- A questionnaire (baseline at the start, end after week 6). p: { kind, answers: [0-3, ...] }
create or replace function public.hs_save_questionnaire(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a smallint[] := array(select (x)::smallint from jsonb_array_elements_text(p -> 'answers') x);
begin
  if uid is null then raise exception 'not signed in'; end if;
  if exists (select 1 from unnest(a) v where v not between 0 and 3) then raise exception 'answers must be 0 to 3'; end if;
  insert into public.members (id) values (uid) on conflict (id) do nothing;
  insert into public.questionnaires (member_id, kind, answers) values (uid, p ->> 'kind', a);
end $$;

-- A finished daily session. Sessions go in order: day N needs day N-1 done first.
create or replace function public.hs_save_day(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  d smallint := (p ->> 'day')::smallint;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.members where id = uid) then raise exception 'no member'; end if;
  if d > 1 and not exists (select 1 from public.day_progress where member_id = uid and day = d - 1) then
    raise exception 'finish the day before first';
  end if;
  insert into public.day_progress (member_id, day, local_date, busy, mood, urge, gambled, amount, action, slip_what, slip_different)
  values (uid, d, (p ->> 'localDate')::date, coalesce((p ->> 'busy')::boolean, false), (p ->> 'mood')::smallint,
    (p ->> 'urge')::smallint, (p ->> 'gambled')::boolean, (p ->> 'amount')::numeric, private.enc(left(p ->> 'action', 300)),
    private.enc(left(p ->> 'slipWhat', 600)), private.enc(left(p ->> 'slipDifferent', 300)))
  on conflict (member_id, day) do update set
    local_date = excluded.local_date, completed_at = now(), busy = excluded.busy, mood = excluded.mood, urge = excluded.urge,
    gambled = excluded.gambled, amount = excluded.amount, action = excluded.action, slip_what = excluded.slip_what,
    slip_different = excluded.slip_different;
end $$;

-- Pause or resume the program. p: { since, until } (until may be null), or null to resume.
create or replace function public.hs_set_pause(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.members set
    paused_since = case when p is null or jsonb_typeof(p) = 'null' then null else (p ->> 'since')::date end,
    paused_until = case when p is null or jsonb_typeof(p) = 'null' then null else (p ->> 'until')::date end,
    updated_at = now()
  where id = auth.uid();
end $$;

-- One Urge SOS use. p: { at, seconds, triggers: [...], passed, helped: [...], note }
create or replace function public.hs_save_urge(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.members (id) values (uid) on conflict (id) do nothing;
  insert into public.urge_logs (member_id, started_at, seconds, triggers, passed, helped, note)
  values (uid, coalesce((p ->> 'at')::timestamptz, now()), coalesce((p ->> 'seconds')::int, 0),
    coalesce(array(select jsonb_array_elements_text(p -> 'triggers')), '{}'), p ->> 'passed',
    coalesce(array(select jsonb_array_elements_text(p -> 'helped')), '{}'), private.enc(left(p ->> 'note', 300)));
end $$;

-- Moves a "try first" Day 1 from the phone into a new account. Does nothing if the account already has a program.
-- p: { nickname, adultConfirmed, onboarding, questionnaires: [...], days: [...] }
create or replace function public.hs_import_guest(p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  x jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.members where id = uid and onboarded_at is not null) then return false; end if;
  perform public.hs_save_member(p);
  for x in select * from jsonb_array_elements(coalesce(p -> 'questionnaires', '[]'::jsonb)) loop
    perform public.hs_save_questionnaire(x);
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p -> 'days', '[]'::jsonb)) order by (value ->> 'day')::int loop
    perform public.hs_save_day(x);
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p -> 'urges', '[]'::jsonb)) loop
    perform public.hs_save_urge(x);
  end loop;
  return true;
end $$;

-- Settings > Delete my data: removes the account; everything else goes with it (on delete cascade).
create or replace function public.hs_delete_my_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.hs_my_state(), public.hs_save_member(jsonb), public.hs_save_questionnaire(jsonb),
  public.hs_save_day(jsonb), public.hs_save_urge(jsonb), public.hs_set_pause(jsonb), public.hs_import_guest(jsonb),
  public.hs_delete_my_data() from public, anon;
grant execute on function public.hs_my_state(), public.hs_save_member(jsonb), public.hs_save_questionnaire(jsonb),
  public.hs_save_day(jsonb), public.hs_save_urge(jsonb), public.hs_set_pause(jsonb), public.hs_import_guest(jsonb),
  public.hs_delete_my_data() to authenticated;
