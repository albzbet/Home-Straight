-- homestr8 0003: hardship access. Members who can't afford Weeks 2 to 8 ask for free access; an admin approves or declines.
-- Run after 0002, in Supabase > SQL Editor > New snippet > Run. Safe to run again.

alter table public.members add column if not exists free_access_at timestamptz; -- set when a hardship request is approved

create table if not exists public.hardship_requests (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  requested_at timestamptz not null default now(),
  note bytea, -- encrypted: anything they chose to tell us
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null
);
create index if not exists hardship_requests_status on public.hardship_requests (status, requested_at);
alter table public.hardship_requests enable row level security;

-- The member's own access: free access granted, and their latest request (if any).
create or replace function public.hs_my_access() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'freeAccess', coalesce((select free_access_at is not null from public.members where id = auth.uid()), false),
    'hardship', (select jsonb_build_object('status', status, 'requestedAt', requested_at)
      from public.hardship_requests where member_id = auth.uid() order by requested_at desc limit 1))
$$;

-- Ask for free access. One open request at a time. p: { note }
create or replace function public.hs_request_hardship(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.members (id) values (uid) on conflict (id) do nothing;
  if exists (select 1 from public.hardship_requests where member_id = uid and status = 'pending') then return; end if;
  insert into public.hardship_requests (member_id, note) values (uid, private.enc(left(p ->> 'note', 1000)));
end $$;

-- Admins: requests to review (pending first, then the last 50 decided). Only the nickname and their message are shown.
create or replace function public.hs_admin_hardship() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.hs_is_admin() then raise exception 'admins only'; end if;
  return coalesce((
    select jsonb_agg(r order by r.pending desc, r."requestedAt" desc) from (
      select h.id, h.status, h.requested_at as "requestedAt", h.decided_at as "decidedAt", h.status = 'pending' as pending,
        coalesce(m.nickname, 'No nickname') as nickname, coalesce(private.dec(h.note), '') as note
      from public.hardship_requests h join public.members m on m.id = h.member_id
      where h.status = 'pending' or h.id in (
        select id from public.hardship_requests where status <> 'pending' order by decided_at desc nulls last limit 50)
    ) r), '[]'::jsonb);
end $$;

create or replace function public.hs_admin_decide_hardship(request_id bigint, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  member uuid;
begin
  if not public.hs_is_admin() then raise exception 'admins only'; end if;
  update public.hardship_requests
    set status = case when approve then 'approved' else 'declined' end, decided_at = now(), decided_by = auth.uid()
    where id = request_id
    returning member_id into member;
  if approve and member is not null then
    update public.members set free_access_at = coalesce(free_access_at, now()) where id = member;
  end if;
end $$;

revoke execute on function public.hs_my_access(), public.hs_request_hardship(jsonb), public.hs_admin_hardship(),
  public.hs_admin_decide_hardship(bigint, boolean) from public, anon;
grant execute on function public.hs_my_access(), public.hs_request_hardship(jsonb), public.hs_admin_hardship(),
  public.hs_admin_decide_hardship(bigint, boolean) to authenticated;
