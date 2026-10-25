import type { DayRecord } from './types';

// How the program moves along. Pure logic, tested in lib/__tests__/program.test.ts.
// One new session a day; missed ones simply wait, so nobody ever "falls behind".

export const TOTAL_DAYS = 42;
export const FREE_DAYS = 1; // days you can do before making an account ("try first")

// Today's date on the phone, as YYYY-MM-DD.
export function localDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The first session not done yet, or null once all 42 are done.
export function nextDay(days: DayRecord[]): number | null {
  const done = new Set(days.map((d) => d.day));
  for (let day = 1; day <= TOTAL_DAYS; day++) if (!done.has(day)) return day;
  return null;
}

export type Today = { day: number | null; unlocked: boolean };

// Which session is up today, and whether it's open yet. A session opens the day after the one before it was done.
export function today(days: DayRecord[], date: string = localDate()): Today {
  const day = nextDay(days);
  if (day === null) return { day: null, unlocked: false };
  if (day === 1) return { day, unlocked: true };
  const prev = days.find((d) => d.day === day - 1);
  return { day, unlocked: !!prev && prev.localDate < date };
}

export const weekOf = (day: number) => Math.ceil(day / 7);

export type DayStatus = 'done' | 'today' | 'tomorrow' | 'later';

// Where one session stands: done, open today, opening tomorrow, or further on.
export function dayStatus(day: number, days: DayRecord[], date: string = localDate()): DayStatus {
  if (days.some((d) => d.day === day)) return 'done';
  const t = today(days, date);
  if (t.day === day) return t.unlocked ? 'today' : 'tomorrow';
  return 'later';
}
