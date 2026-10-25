import { describe, expect, it } from 'vitest';
import { inviteEmail, summaryEmail } from '@/supabase/functions/buddy/templates';

const all = (e: { subject: string; text: string; html: string }) => `${e.subject} ${e.text} ${e.html}`.toLowerCase();

describe('buddy emails', () => {
  const invite = inviteEmail({ nickname: 'Robbo', yesUrl: 'https://x/buddy?t=abc&a=yes', stopUrl: 'https://x/buddy?t=abc&a=stop' });

  it('invites with a yes and a no, and says nothing personal', () => {
    expect(invite.subject).toBe('Robbo would like you in their corner');
    expect(invite.text).toContain("Yes, I'm in: https://x/buddy?t=abc&a=yes");
    expect(invite.text).toContain('No thanks: https://x/buddy?t=abc&a=stop');
  });

  it('weekly note counts sessions kindly, with a stop link', () => {
    const week = summaryEmail({ nickname: 'Robbo', sessionsThisWeek: 1, sessionsTotal: 9, stopUrl: 'https://x/stop', seed: 3 });
    expect(week.text).toContain('Robbo did 1 session this week (9 so far).');
    expect(week.text).toContain('https://x/stop');
    const none = summaryEmail({ nickname: 'Robbo', sessionsThisWeek: 0, sessionsTotal: 9, stopUrl: 'https://x/stop', seed: 0 });
    expect(none.text).toContain("didn't get to a session this week. Life gets busy");
  });

  it('never mentions gambling or money', () => {
    const week = summaryEmail({ nickname: 'Robbo', sessionsThisWeek: 3, sessionsTotal: 3, stopUrl: 'https://x', seed: 1 });
    for (const e of [invite, week]) for (const word of ['gambl', 'bet', 'pokies', 'money', '$']) expect(all(e)).not.toContain(word);
  });

  it('escapes nicknames in the html', () => {
    const e = summaryEmail({ nickname: '<b>Al</b>', sessionsThisWeek: 1, sessionsTotal: 1, stopUrl: 'https://x', seed: 1 });
    expect(e.html).toContain('&lt;b&gt;Al&lt;/b&gt;');
  });
});
