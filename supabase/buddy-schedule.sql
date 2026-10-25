-- homestr8: the schedule for buddy emails. Run this ONCE, only after the "buddy" Edge Function is deployed with its secrets
-- (see the README, "Buddy emails"). Replace YOUR-PROJECT-REF below with your project's ref (Project Settings > General).
-- Running it again just updates the schedule.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Every 15 minutes: send invitations to newly added buddies.
select cron.schedule('hs-buddy-invites', '*/15 * * * *', $job$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/buddy',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-key', (select decrypted_secret from vault.decrypted_secrets where name = 'hs_cron_key')),
    body := '{"mode":"invites"}'::jsonb)
$job$);

-- Every Sunday 22:00 UTC (Monday 8am in Sydney in winter, 9am in summer): the weekly notes.
select cron.schedule('hs-buddy-weekly', '0 22 * * 0', $job$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/buddy',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-key', (select decrypted_secret from vault.decrypted_secrets where name = 'hs_cron_key')),
    body := '{"mode":"summaries"}'::jsonb)
$job$);
