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
  const goalShare = goalProgress(state, today)?.share ?? null;
  return { daysSinceStart, gambleFreeDays, streak, moneyKept, goalShare };
}

export type GoalProgress = {
  name: string; // what they're saving for ('' if they didn't say)
  target: number;
  kept: number; // money kept since the goal was set (an estimate)
  share: number; // 0-1
  reached: boolean;
  weeksToGo: number | null; // at their usual weekly spend; null if we don't know it or it's reached
};

// Their savings goal: money kept counts from the day it was set (a new goal starts from $0), never before the program.
export function goalProgress(state: ProgramState, today: string = localDate()): GoalProgress | null {
  const o = state.onboarding;
  if (!o?.savingTarget) return null;
  const start = startOfProgram(state, today);
  const from = o.goalSince && o.goalSince > start ? o.goalSince : start;
  const days = from <= today ? daysBetween(from, today) + 1 : 0;
  const slips = [...gambleDates(state)].filter((d) => d >= from && d <= today).length;
  const kept = o.weeklySpend ? Math.round((o.weeklySpend / 7) * Math.max(0, days - slips)) : 0;
  const reached = kept >= o.savingTarget;
  return {
    name: o.savingFor.trim(),
    target: o.savingTarget,
    kept,
    share: Math.min(1, kept / o.savingTarget),
    reached,
    weeksToGo: !reached && o.weeklySpend ? Math.ceil((o.savingTarget - kept) / o.weeklySpend) : null,
  };
}

export type Period = 'week' | 'month' | 'total';

export type PeriodStats = {
  moneyKept: number;
  gambleFreeDays: number;
  sessions: number; // program sessions done
  urgesHandled: number; // Urge SOS uses where the urge passed or was easing
};

// The day the program started: when onboarding was finished (or the first session).
export const startOfProgram = (state: ProgramState, today: string) => {
  const o = state.onboarding;
  return o?.completedAt ? localDate(new Date(o.completedAt)) : (state.days[0]?.localDate ?? today);
};

// The first day of this week (Monday), this month, or the program.
export function periodStart(period: Period, today: string, programStart: string): string {
  let from = programStart;
  if (period === 'week') {
    const d = toDate(today);
    from = addDays(today, -((d.getDay() + 6) % 7));
  } else if (period === 'month') from = `${today.slice(0, 8)}01`;
  return from > programStart ? from : programStart;
}

// Progress screen: what this week, this month or the whole program added up to.
export function periodStats(state: ProgramState, period: Period, today: string = localDate()): PeriodStats {
  const from = periodStart(period, today, startOfProgram(state, today));
  const inRange = (d: string) => d >= from && d <= today;
  const days = from <= today ? daysBetween(from, today) + 1 : 0;
  const slips = [...gambleDates(state)].filter(inRange).length;
  const gambleFreeDays = Math.max(0, days - slips);
  const spend = state.onboarding?.weeklySpend ?? 0;
  return {
    moneyKept: Math.round((spend / 7) * gambleFreeDays),
    gambleFreeDays,
    sessions: state.days.filter((d) => inRange(d.localDate)).length,
    urgesHandled: state.urges.filter((u) => u.passed !== 'gambled' && inRange(localDate(new Date(u.at)))).length,
  };
}

export type WeeklyGoal = { id: 'sessions' | 'money' | 'gambleFree'; label: string; at: number; of: number };

// This week's goals, worked out from the program and their usual spend (nothing to set up): 5 sessions, keep a week's
// usual spend, 7 gamble-free days. The money goal only shows if they told us their spend.
export function weeklyGoals(state: ProgramState, today: string = localDate(), sessionsGoal = 5): WeeklyGoal[] {
  const week = periodStats(state, 'week', today);
  const spend = state.onboarding?.weeklySpend ?? 0;
  const goals: WeeklyGoal[] = [
    { id: 'sessions', label: `Complete ${sessionsGoal} sessions`, at: Math.min(week.sessions, sessionsGoal), of: sessionsGoal },
  ];
  if (spend > 0)
    goals.push({
      id: 'money',
      label: `Keep $${Math.round(spend)}`,
      at: Math.min(week.moneyKept, Math.round(spend)),
      of: Math.round(spend),
    });
  goals.push({ id: 'gambleFree', label: '7 gamble-free days', at: Math.min(week.gambleFreeDays, 7), of: 7 });
  return goals;
}
