import { localDate, nextDay } from './program';
import type { ProgramState } from './types';

// Which reminders to have waiting on the phone. Worked out afresh every time the app opens or something changes.
// - The morning reminder for the next couple of days (not today if today's session is done).
// - If no session for a couple of days: one "Welcome back" nudge, then nothing more. Never a run of nags.
// - Paused: nothing, except one gentle note on the day a timed pause ends.
// Pure logic, tested in lib/__tests__/reminderPlan.test.ts.

export type Planned = { at: Date; kind: 'daily' | 'welcomeBack' | 'resume' };

const DAY = 86_400_000;
const atTime = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h!, m!, 0, 0);
  return d;
};
const plusDays = (date: string, n: number) => localDate(new Date(new Date(`${date}T12:00:00`).getTime() + n * DAY));

export function isPaused(state: ProgramState, today: string = localDate()): boolean {
  return !!state.pause && (state.pause.until === null || state.pause.until > today);
}

export function reminderPlan(state: ProgramState, now: Date, quietDays = 2): Planned[] {
  const o = state.onboarding;
  if (!o) return [];
  const today = localDate(now);
  const time = o.reminderTime || '07:30';

  if (isPaused(state, today)) {
    const until = state.pause!.until;
    return until ? [{ at: atTime(until, time), kind: 'resume' }] : [];
  }
  if (nextDay(state.days) === null) return []; // program finished

  // The last day they did a session (or started, or came back from a pause).
  const lastSession = state.days
    .map((d) => d.localDate)
    .sort()
    .at(-1);
  const start = o.completedAt ? localDate(new Date(o.completedAt)) : today;
  const resumed = state.pause?.until ?? null;
  const base = [lastSession, start, resumed]
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)!;
  const doneToday = lastSession === today;

  const plan: Planned[] = [];
  for (let i = 0; i <= quietDays; i++) {
    const date = plusDays(today, i);
    if (date > plusDays(base, quietDays)) break;
    if (date === today && doneToday) continue;
    const at = atTime(date, time);
    if (at > now) plan.push({ at, kind: 'daily' });
  }
  // One welcome-back, the day after the quiet stretch (or tomorrow, if that's already gone by).
  let back = atTime(plusDays(base, quietDays + 1), time);
  if (back <= now) back = atTime(plusDays(today, 1), time);
  if (!plan.some((p) => p.at.getTime() === back.getTime())) plan.push({ at: back, kind: 'welcomeBack' });
  return plan;
}
