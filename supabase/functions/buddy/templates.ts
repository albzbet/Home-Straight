// The buddy emails. Plain, warm and short. They never mention gambling, money or anything the member has written: only that
// they're doing a wellbeing program and how many sessions they've done. Tested in lib/__tests__/buddyEmails.test.ts.

export type Email = { subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const NUDGES = [
  'A short message like "Proud of you, keep going" goes a long way.',
  'You don\'t need the right words. "Thinking of you" is plenty.',
  'Asking "How are you going?" and really listening can make someone\'s day.',
  'Maybe suggest a walk, a coffee or a game of something this week.',
  'Small, steady encouragement helps more than big speeches.',
];

function html(paragraphs: string[], links: { label: string; url: string }[] = [], footer = ''): string {
  return `<div style="font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#1F2D2B;line-height:1.5;max-width:520px">
${paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}
${links.map((l) => `<p><a href="${esc(l.url)}" style="color:#2F6F62;font-weight:bold">${esc(l.label)}</a></p>`).join('\n')}
${footer ? `<p style="color:#5E6B68;font-size:13px">${footer}</p>` : ''}
</div>`;
}

export function inviteEmail(o: { nickname: string; yesUrl: string; stopUrl: string }): Email {
  const intro = [
    'Hi there,',
    `${o.nickname} is doing an 8-week morning wellbeing program and would like you to be their support buddy.`,
    "If you say yes, you'll get one short email a week saying how many sessions they've done, with a nudge to send them some encouragement. That's all: nothing personal about what they're working on.",
  ];
  const close = "If you'd rather not, that's completely fine. If you don't reply, you won't hear from us again.";
  return {
    subject: `${o.nickname} would like you in their corner`,
    text: `${intro.join('\n\n')}\n\nYes, I'm in: ${o.yesUrl}\n\nNo thanks: ${o.stopUrl}\n\n${close}`,
    html: html(
      intro,
      [
        { label: "Yes, I'm in", url: o.yesUrl },
        { label: 'No thanks', url: o.stopUrl },
      ],
      esc(close),
    ),
  };
}

export function summaryEmail(o: {
  nickname: string;
  sessionsThisWeek: number;
  sessionsTotal: number;
  stopUrl: string;
  seed: number;
}): Email {
  const n = o.sessionsThisWeek;
  const line =
    n > 0
      ? `${o.nickname} did ${n} ${n === 1 ? 'session' : 'sessions'} this week (${o.sessionsTotal} so far).`
      : `${o.nickname} didn't get to a session this week. Life gets busy, and a quick message from you could be just the thing.`;
  const nudge = NUDGES[Math.abs(o.seed) % NUDGES.length]!;
  const stop = "Don't want these any more? Stop them here";
  return {
    subject: `${o.nickname}'s week`,
    text: `Hi there,\n\n${line}\n\n${nudge}\n\n${stop}: ${o.stopUrl}`,
    html: html(['Hi there,', line, nudge], [], `${esc(stop)}: <a href="${esc(o.stopUrl)}" style="color:#5E6B68">stop these emails</a>`),
  };
}
