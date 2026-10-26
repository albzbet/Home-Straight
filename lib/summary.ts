import { planLine } from './plans';
import { gambleDates } from './progress';
import { localDate } from './program';
import type { ProgramState } from './types';

// Week-end summaries, the before-and-after comparison and the personal game plan. Pure logic, tested in
// lib/__tests__/summary.test.ts.

const DAY = 86_400_000;
const dayAfter = (s: string) => localDate(new Date(new Date(`${s}T12:00:00`).getTime() + DAY));

export type WeekSummary = {
  week: number;
  sessions: number; // of 7
  urgesHandled: number; // Urge SOS uses where the urge passed or was easing
  gambleFreeDays: number;
  moneyKept: number;
  averageMood: number | null; // 1-5
};

// A week runs from the day after the previous week's last session to the day of this week's last session.
export function weekSummary(state: ProgramState, week: number): WeekSummary {
  const inWeek = state.days.filter((d) => Math.ceil(d.day / 7) === week).sort((a, b) => a.day - b.day);
  const prevLast = state.days.find((d) => d.day === (week - 1) * 7)?.localDate;
  const startOfProgram = state.onboarding?.completedAt ? localDate(new Date(state.onboarding.completedAt)) : inWeek[0]?.localDate;
  const from = prevLast ? dayAfter(prevLast) : startOfProgram;
  const to = inWeek.at(-1)?.localDate;
  const inRange = (d: string) => !!from && !!to && d >= from && d <= to;

  let days = 0;
  if (from && to) for (let d = from; d <= to; d = dayAfter(d)) days++;
  const slips = [...gambleDates(state)].filter(inRange).length;
  const gambleFreeDays = Math.max(0, days - slips);
  const urgesHandled = state.urges.filter((u) => u.passed !== 'gambled' && inRange(localDate(new Date(u.at)))).length;
  const moods = inWeek.map((d) => d.mood).filter((m): m is number => m !== null);
  const spend = state.onboarding?.weeklySpend ?? 0;
  return {
    week,
    sessions: inWeek.length,
    urgesHandled,
    gambleFreeDays,
    moneyKept: Math.round((spend / 7) * gambleFreeDays),
    averageMood: moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null,
  };
}

// How the end-of-program answers compare with the first ones, question by question. Lower answers mean gambling is
// causing less harm. Counts only: never a score or a label.
export function questionnaireChange(state: ProgramState): { better: number; same: number; worse: number } | null {
  const before = state.questionnaires.find((q) => q.kind === 'baseline');
  const after = state.questionnaires.filter((q) => q.kind === 'end').at(-1);
  if (!before || !after) return null;
  const out = { better: 0, same: 0, worse: 0 };
  before.answers.forEach((b, i) => {
    const a = after.answers[i];
    if (a === undefined) return;
    if (a < b) out.better++;
    else if (a > b) out.worse++;
    else out.same++;
  });
  return out;
}

export type GamePlan = {
  why: string[];
  triggers: string[];
  ifThen: string[]; // "Payday → I'll move money into savings first thing"
  whatHelps: string[];
  myActions: string[];
  ifISlip: string[];
  support: string[];
};

// Most common first, no repeats.
const ranked = (items: string[]) => {
  const counts = new Map<string, number>();
  for (const i of items.map((x) => x.trim()).filter(Boolean)) counts.set(i, (counts.get(i) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
};

// Put together from everything they've told the program: their why, their triggers, what helped with urges, the
// actions they chose, what they said they'd do differently after a slip, and who they can lean on.
export function gamePlan(state: ProgramState): GamePlan {
  const o = state.onboarding;
  return {
    why: [...(o?.whyChoices ?? []), ...(o?.whyText ? [o.whyText] : [])],
    triggers: ranked([...(o?.riskyTimes ?? []), ...state.urges.flatMap((u) => u.triggers)]),
    ifThen: state.plans.map(planLine),
    whatHelps: ranked(state.urges.filter((u) => u.passed !== 'gambled').flatMap((u) => u.helped)).slice(0, 6),
    myActions: ranked(state.days.map((d) => d.action)).slice(0, 8),
    ifISlip: ranked(state.days.map((d) => d.slipDifferent ?? '')).slice(0, 5),
    support: [...(o?.buddyEmail ? ['My buddy'] : []), 'Gambling Help Online: 1800 858 858 (24/7)', 'Lifeline: 13 11 14 (24/7)'],
  };
}
