// The "buddy" Edge Function: sends buddy invitations and weekly notes through Resend, and records a buddy's yes or stop.
// Runs on Supabase (Deno), not in the app. Switching it on is in the README ("Buddy emails").
//
// POST with header x-cron-key and { mode: 'invites' | 'summaries' }: sent by the schedule (supabase/buddy-schedule.sql).
// POST with { token, answer: 'yes' | 'stop' }: from the buddy page in the app's web version (app/buddy.tsx).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { inviteEmail, summaryEmail, type Email } from './templates.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM'); // e.g. "homestr8 <hello@yourdomain.com.au>"
const BUDDY_PAGE_URL = Deno.env.get('BUDDY_PAGE_URL'); // e.g. "https://homestr8.netlify.app/buddy"

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-cron-key, authorization, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Work = { memberId: string; token: string; nickname: string; email: string; sessionsThisWeek: number; sessionsTotal: number };

async function send(to: string, email: Email) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject: email.subject, text: email.text, html: email.html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'not found' }, 404);
  const body = await req.json().catch(() => ({}));

  // A buddy pressed "Yes, I'm in" or "Stop" on the buddy page.
  if (typeof body.token === 'string') {
    if (body.answer !== 'yes' && body.answer !== 'stop') return json({ error: 'bad answer' }, 400);
    const { data, error } = await db.rpc('hs_buddy_respond', { link_token: body.token, answer: body.answer });
    if (error) return json({ error: 'failed' }, 500);
    return json({ ok: !!data, nickname: data ?? null });
  }

  // The schedule: only with the right key.
  const key = req.headers.get('x-cron-key') ?? '';
  const { data: keyOk } = await db.rpc('hs_check_cron_key', { key });
  if (!keyOk) return json({ error: 'not allowed' }, 401);
  if (!RESEND_API_KEY || !EMAIL_FROM || !BUDDY_PAGE_URL)
    return json({ error: 'RESEND_API_KEY, EMAIL_FROM and BUDDY_PAGE_URL must be set' }, 500);
  const mode = body.mode === 'summaries' ? 'summaries' : 'invites';

  const { data, error } = await db.rpc('hs_buddy_work', { mode });
  if (error) return json({ error: error.message }, 500);
  const link = (token: string, a: string) => `${BUDDY_PAGE_URL}?t=${token}&a=${a}`;
  let sent = 0;
  const failed: string[] = [];
  for (const w of (data ?? []) as Work[]) {
    try {
      const email =
        mode === 'invites'
          ? inviteEmail({ nickname: w.nickname, yesUrl: link(w.token, 'yes'), stopUrl: link(w.token, 'stop') })
          : summaryEmail({ ...w, stopUrl: link(w.token, 'stop'), seed: Math.floor(Date.now() / 604_800_000) });
      await send(w.email, email);
      await db.rpc('hs_buddy_sent', { member: w.memberId, mode });
      sent++;
    } catch (e) {
      failed.push(String(e)); // nothing about who: just the error, for the function's logs
    }
  }
  return json({ mode, sent, failed });
});
