-- homestr8 0004: the accountability buddy. A member's mate is invited by email and must say yes before getting anything;
-- then a short weekly note (sessions done and a few kind words, never gambling details). Every email has a one-tap stop.
-- Run after 0003, in Supabase > SQL Editor > New snippet > Run. Safe to run again.
-- The emails themselves are sent by the "buddy" Edge Function (supabase/functions/buddy); see the README to switch it on.

-- One row per member who has a buddy they've agreed to share with. The buddy's email stays in members.buddy_email (encrypted);
-- this keeps where the invitation is up to.
create table if not exists public.buddies (
  member_id uuid primary key references public.members (id) on delete cascade,
  email_fingerprint text not null, -- to notice when the member changes their buddy
  token text not null unique, -- in the buddy's yes / stop links
  invited_at timestamptz,
  confirmed_at timestamptz,
  stopped_at timestamptz,
  last_summary_at timestamptz
);
alter table public.buddies enable row level security;

-- A random key the scheduled job sends to the Edge Function, so only the schedule can make it send emails. Kept in Vault.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'hs_cron_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'hs_cron_key', 'Lets the schedule run the buddy emails');
  end if;
end $$;

-- Keep buddies in step with the member's choices: a new email starts a fresh invitation; no consent or no email removes it.
create or replace function private.sync_buddy() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  email text := private.dec(new.buddy_email);
  print text;
begin
  if new.buddy_consent_at is null or coalesce(email, '') = '' then
    delete from public.buddies where member_id = new.id;
    return new;
  end if;
  print := encode(extensions.digest(lower(btrim(email)), 'sha256'), 'hex');
  insert into public.buddies (member_id, email_fingerprint, token)
  values (new.id, print, encode(extensions.gen_random_bytes(18), 'hex'))
  on conflict (member_id) do update set
    email_fingerprint = excluded.email_fingerprint, token = excluded.token,
    invited_at = null, confirmed_at = null, stopped_at = null, last_summary_at = null
  where public.buddies.email_fingerprint <> excluded.email_fingerprint;
  return new;
end $$;

drop trigger if exists members_sync_buddy on public.members;
create trigger members_sync_buddy after insert or update of buddy_email, buddy_consent_at on public.members
  for each row execute function private.sync_buddy();

-- Bring in anyone who added a buddy before this file was run.
update public.members set buddy_email = buddy_email where buddy_consent_at is not null;

-- ---------------------------------------------------------------------------
-- For the member (Settings > Your buddy)
-- ---------------------------------------------------------------------------
create or replace function public.hs_my_buddy() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('status', case
    when b.member_id is null then 'none'
    when b.stopped_at is not null then 'stopped'
    when b.confirmed_at is not null then 'confirmed'
    when b.invited_at is not null then 'invited'
    else 'waiting' end)
  from (select auth.uid() as uid) me left join public.buddies b on b.member_id = me.uid
$$;
revoke execute on function public.hs_my_buddy() from public, anon;
grant execute on function public.hs_my_buddy() to authenticated;

-- ---------------------------------------------------------------------------
-- For the Edge Function only (it uses the service role key; members and the public can't call these)
-- ---------------------------------------------------------------------------
create or replace function public.hs_check_cron_key(key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'hs_cron_key' and decrypted_secret = key)
$$;

-- Emails to send now. mode 'invites': buddies not yet invited. mode 'summaries': confirmed buddies due their weekly note
-- (skipped while the member's program is paused).
create or replace function public.hs_buddy_work(mode text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'memberId', b.member_id, 'token', b.token, 'nickname', coalesce(m.nickname, 'Your mate'),
    'email', private.dec(m.buddy_email),
    'sessionsThisWeek', (select count(*) from public.day_progress d where d.member_id = b.member_id and d.completed_at > now() - interval '7 days'),
    'sessionsTotal', (select count(*) from public.day_progress d where d.member_id = b.member_id))), '[]'::jsonb)
  from public.buddies b join public.members m on m.id = b.member_id
  where b.stopped_at is null and m.buddy_consent_at is not null and case mode
    when 'invites' then b.invited_at is null
    when 'summaries' then b.confirmed_at is not null
      and (b.last_summary_at is null or b.last_summary_at < now() - interval '6 days')
      and (m.paused_since is null or (m.paused_until is not null and m.paused_until <= current_date))
    else false end
$$;

create or replace function public.hs_buddy_sent(member uuid, mode text) returns void
language sql security definer set search_path = public as $$
  update public.buddies set
    invited_at = case when mode = 'invites' then now() else invited_at end,
    last_summary_at = case when mode = 'summaries' then now() else last_summary_at end
  where member_id = member
$$;

-- The buddy tapped "Yes" or "Stop" in an email. Returns the member's nickname for the thank-you page (null: unknown link).
create or replace function public.hs_buddy_respond(link_token text, answer text) returns text
language plpgsql security definer set search_path = public as $$
declare
  member uuid;
begin
  update public.buddies set
    confirmed_at = case when answer = 'yes' and stopped_at is null then coalesce(confirmed_at, now()) else confirmed_at end,
    stopped_at = case when answer = 'stop' then coalesce(stopped_at, now()) else stopped_at end
  where token = link_token
  returning member_id into member;
  return (select coalesce(nickname, 'your mate') from public.members where id = member);
end $$;

revoke execute on function public.hs_check_cron_key(text), public.hs_buddy_work(text), public.hs_buddy_sent(uuid, text),
  public.hs_buddy_respond(text, text) from public, anon, authenticated;
grant execute on function public.hs_check_cron_key(text), public.hs_buddy_work(text), public.hs_buddy_sent(uuid, text),
  public.hs_buddy_respond(text, text) to service_role;
