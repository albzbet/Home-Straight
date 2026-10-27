import { localDate } from './program';
import { gambleDates, periodStart, startOfProgram, weeklyGoals, type WeeklyGoal } from './progress';
import type { GoalBreak, ProgramState } from './types';

// Cutting back and taking a break: how this week stacks up against their own limits, and where they're up to in a break.
// Pure logic, tested in lib/__tests__/goalPlan.test.ts.

const DAY = 86_400_000;
const toDate = (s: string) => new Date(`${s}T12:00:00`);
const addDays = (s: string, n: number) => localDate(new Date(toDate(s).getTime() + n * DAY));
const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);

export type LimitsWeek = {
  spent: number; // what they told us they spent on the days they gambled (check-in "how much, roughly?")
  days: number; // days they gambled
  weeklyMoney: number | null;
  daysPerWeek: number | null;
  withinMoney: boolean;
  withinDays: boolean;
};

// This week (from Monday, never before the program) against their limits. Null unless they're cutting back.
export function limitsThisWeek(state: ProgramState, today: string = localDate()): LimitsWeek | null {
  const o = state.onboarding;
  if (o?.goal !== 'cut_back' || !o.limits) return null;
  const from = periodStart('week', today, startOfProgram(state, today));
  const inWeek = (d: string) => d >= from && d <= today;
  // A check-in "yes" is about the day before. One amount per day: the biggest if a day was reported twice.
  const amounts = new Map<string, number>();
  for (const c of [...state.days, ...state.checkins])
    if (c.gambled && c.amount) {
      const d = addDays(c.localDate, -1);
      amounts.set(d, Math.max(amounts.get(d) ?? 0, c.amount));
    }
  const spent = [...amounts].filter(([d]) => inWeek(d)).reduce((sum, [, a]) => sum + a, 0);
  const days = [...gambleDates(state)].filter(inWeek).length;
  const { weeklyMoney, daysPerWeek } = o.limits;
  return {
    spent: Math.round(spent),
    days,
    weeklyMoney,
    daysPerWeek,
    withinMoney: weeklyMoney === null || spent <= weeklyMoney,
    withinDays: daysPerWeek === null || days <= daysPerWeek,
  };
}

// The break lengths offered, in days.
export const BREAK_LENGTHS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 91 },
  { label: '6 months', days: 182 },
];

export const breakFor = (days: number, from: string = localDate()): GoalBreak => ({ from, until: addDays(from, days) });

export type BreakStatus = { day: number; total: number; daysLeft: number; ended: boolean; until: string };

// Where they're up to in a break: day 1 is the day it started; it has ended once the "until" day arrives.
export function breakStatus(b: GoalBreak | null | undefined, today: string = localDate()): BreakStatus | null {
  if (!b) return null;
  const total = Math.max(1, daysBetween(b.from, b.until));
  const day = Math.min(total, Math.max(1, daysBetween(b.from, today) + 1));
  const daysLeft = Math.max(0, total - day); // days still to come after today
  return { day, total, daysLeft, ended: today >= b.until, until: b.until };
}

// This week's goals. Cutting back with limits: their own limits stand in for "keep a week's spend" and "7 gamble-free days".
export function goalsForWeek(state: ProgramState, today: string = localDate()): WeeklyGoal[] {
  const goals = weeklyGoals(state, today);
  const l = limitsThisWeek(state, today);
  if (!l) return goals;
  const limits: WeeklyGoal[] = [];
  if (l.weeklyMoney !== null)
    limits.push({
      id: 'limitMoney',
      label: `Spend no more than $${Math.round(l.weeklyMoney)}`,
      at: l.spent,
      of: l.weeklyMoney,
      lowerIsBetter: true,
    });
  if (l.daysPerWeek !== null)
    limits.push({
      id: 'limitDays',
      label: l.daysPerWeek === 0 ? 'No gambling days' : `Gamble on ${l.daysPerWeek} ${l.daysPerWeek === 1 ? 'day' : 'days'} at most`,
      at: l.days,
      of: l.daysPerWeek,
      lowerIsBetter: true,
    });
  return [...goals.filter((g) => g.id === 'sessions'), ...limits];
}
