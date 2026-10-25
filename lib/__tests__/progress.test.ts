import { describe, expect, it } from 'vitest';
import { goalProgress, lastCheckinDate, periodStart, periodStats, progress, weeklyGoals } from '@/lib/progress';
import { emptyState, type DayRecord, type Onboarding, type ProgramState } from '@/lib/types';

const onboarding = (startDate: string, weeklySpend: number | null = 140, savingTarget: number | null = 200): Onboarding => ({
  goal: 'quit',
  gamblingTypes: [],
  whyChoices: [],
  whyText: '',
  weeklySpend,
  savingFor: '',
  savingTarget,
  riskyTimes: [],
  payday: '',
  habit: '',
  reminderTime: '07:30',
  buddyEmail: '',
  buddyConsent: false,
  completedAt: `${startDate}T09:00:00`,
});
const checkin = (day: number, localDate: string, gambled: boolean): DayRecord => ({
  day,
  localDate,
  completedAt: `${localDate}T09:00:00`,
  busy: false,
  mood: 3,
  urge: 3,
  gambled,
  amount: null,
  action: '',
});
const state = (extra: Partial<ProgramState>): ProgramState => ({ ...emptyState, onboarding: onboarding('2026-10-01'), ...extra });

describe('progress', () => {
  it('counts every day from the start, today included', () => {
    const p = progress(state({}), '2026-10-10');
    expect(p).toMatchObject({ daysSinceStart: 10, gambleFreeDays: 10, streak: 10, moneyKept: 200, goalShare: 1 });
  });

  it('a slip restarts the streak but keeps the total', () => {
    // Check-in on the 6th says "yes": the 5th was a gambling day.
    const p = progress(state({ days: [checkin(1, '2026-10-01', false), checkin(2, '2026-10-06', true)] }), '2026-10-10');
    expect(p.gambleFreeDays).toBe(9);
    expect(p.streak).toBe(5); // 6th to 10th
    expect(p.moneyKept).toBe(180);
  });

  it('counts an Urge SOS "I gambled" on its own day, once', () => {
    const urge = { at: '2026-10-05T20:00:00', seconds: 60, triggers: [], passed: 'gambled' as const, helped: [], note: '' };
    const p = progress(state({ urges: [urge], days: [checkin(2, '2026-10-06', true)] }), '2026-10-10');
    expect(p.gambleFreeDays).toBe(9);
  });

  it('copes with no spend or goal', () => {
    const p = progress({ ...emptyState, onboarding: onboarding('2026-10-01', null, null) }, '2026-10-01');
    expect(p).toMatchObject({ daysSinceStart: 1, moneyKept: 0, goalShare: null });
  });
});

describe('daily check-ins', () => {
  it('count a slip the day before, like session check-ins', () => {
    const daily = { localDate: '2026-10-08', mood: 3, urge: 2, gambled: true, amount: null, action: '', slipWhat: '', slipDifferent: '' };
    const p = progress(state({ checkins: [daily] }), '2026-10-10');
    expect(p.gambleFreeDays).toBe(9);
    expect(p.streak).toBe(3);
    expect(lastCheckinDate(state({ checkins: [daily], days: [checkin(1, '2026-10-02', false)] }))).toBe('2026-10-08');
  });
});

describe('periodStats and weeklyGoals', () => {
  // Program started Thu 1 Oct 2026; "today" is Sat 10 Oct, so this week runs Mon 5 to Sat 10.
  const days = [checkin(1, '2026-10-01', false), checkin(2, '2026-10-06', false), checkin(3, '2026-10-08', true)];
  const s = state({ days });

  it('adds up this week, this month and the whole program', () => {
    expect(periodStats(s, 'week', '2026-10-10')).toEqual({ moneyKept: 100, gambleFreeDays: 5, sessions: 2, urgesHandled: 0 });
    expect(periodStats(s, 'month', '2026-10-10')).toMatchObject({ gambleFreeDays: 9, sessions: 3 });
    expect(periodStats(s, 'total', '2026-10-10')).toMatchObject({ gambleFreeDays: 9, moneyKept: 180 });
  });

  it('never starts before the program did', () => {
    expect(periodStart('week', '2026-10-02', '2026-10-01')).toBe('2026-10-01');
    expect(periodStart('week', '2026-10-10', '2026-09-01')).toBe('2026-10-05');
    expect(periodStart('month', '2026-10-10', '2026-09-01')).toBe('2026-10-01');
  });

  it('sets this week’s goals from the program and their spend', () => {
    expect(weeklyGoals(s, '2026-10-10').map((g) => [g.label, g.at, g.of])).toEqual([
      ['Complete 5 sessions', 2, 5],
      ['Keep $140', 100, 140],
      ['7 gamble-free days', 5, 7],
    ]);
    const noSpend = { ...s, onboarding: { ...s.onboarding!, weeklySpend: null } };
    expect(weeklyGoals(noSpend, '2026-10-10').map((g) => g.id)).toEqual(['sessions', 'gambleFree']);
  });
});

describe('goalProgress', () => {
  const base = (extra: Partial<Onboarding> = {}): ProgramState => ({
    ...emptyState,
    onboarding: { ...onboarding('2026-10-01', 140, 500), savingFor: 'A trip to Bali', ...extra },
  });
  it('counts money kept since the start, with weeks to go', () => {
    // 10 days at $20 a day = $200 of $500; $300 to go at $140 a week = 3 weeks.
    expect(goalProgress(base(), '2026-10-10')).toMatchObject({
      name: 'A trip to Bali',
      kept: 200,
      share: 0.4,
      reached: false,
      weeksToGo: 3,
    });
  });
  it('starts a new goal from $0 on the day it was set', () => {
    expect(goalProgress(base({ goalSince: '2026-10-10' }), '2026-10-10')).toMatchObject({ kept: 20, weeksToGo: 4 });
  });
  it('knows when it is reached', () => {
    expect(goalProgress(base({ savingTarget: 100 }), '2026-10-10')).toMatchObject({ kept: 200, share: 1, reached: true, weeksToGo: null });
  });
  it('is null without a target', () => {
    expect(goalProgress(base({ savingTarget: null }), '2026-10-10')).toBeNull();
  });
});
