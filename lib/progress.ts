import { localDate } from './program';
import type { ProgramState } from './types';

// Gamble-free days and money kept, worked out from check-ins and Urge SOS logs. Pure logic, tested in
// lib/__tests__/progress.test.ts. A slip never resets the total: only "days in a row" starts again.

const DAY = 86_400_000;
const toDate = (s: string) => new Date(`${s}T12:00:00`);
const addDays = (s: string, n: number) => localDate(new Date(toDate(s).getTime() + n * DAY));
const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);

export type Progress = {
  daysSinceStart: number; // counting today
  gambleFreeDays: number; // total, over the whole time
  streak: number; // days in a row without gambling, up to today
  moneyKept: number; // estimate, in dollars
  goalShare: number | null; // 0-1 of the way to their savings target
};

// The days someone said they gambled: a check-in "yes" (session or daily) means the day before it; an Urge SOS
// "I gambled" means that day.
export function gambleDates(state: ProgramState): Set<string> {
  const dates = new Set<string>();
  for (const d of state.days) if (d.gambled) dates.add(addDays(d.localDate, -1));
  for (const u of state.urges) if (u.passed === 'gambled') dates.add(localDate(new Date(u.at)));
  for (const c of state.checkins) if (c.gambled) dates.add(addDays(c.localDate, -1));
  return dates;
}

// The most recent check-in of any kind (session or daily), for "since your last check-in".
export function lastCheckinDate(state: ProgramState): string | undefined {
  return [...state.days.map((d) => d.localDate), ...state.checkins.map((c) => c.localDate)].sort().at(-1);
}

export function progress(state: ProgramState, today: string = localDate()): Progress {
  const o = state.onboarding;
  const start = o?.completedAt ? localDate(new Date(o.completedAt)) : (state.days[0]?.localDate ?? today);
  const daysSinceStart = Math.max(0, daysBetween(start, today) + 1);
  const slips = [...gambleDates(state)].filter((d) => d >= start && d <= today).sort();
  const gambleFreeDays = Math.max(0, daysSinceStart - slips.length);
  const last = slips.at(-1);
  const streak = last ? daysBetween(last, today) : daysSinceStart;
  const moneyKept = o?.weeklySpend ? Math.round((o.weeklySpend / 7) * gambleFreeDays) : 0;
  const goalShare = o?.savingTarget ? Math.min(1, moneyKept / o.savingTarget) : null;
  return { daysSinceStart, gambleFreeDays, streak, moneyKept, goalShare };
}
