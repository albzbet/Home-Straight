import { describe, expect, it } from 'vitest';
import { breakFor, breakStatus, goalsForWeek, limitsThisWeek } from '@/lib/goalPlan';
import { emptyState, type DailyCheckin, type Onboarding, type ProgramState } from '@/lib/types';

// Started Thu 1 Oct 2026; "today" is Sat 10 Oct, so this week runs Mon 5 to Sat 10.
const onboarding = (extra: Partial<Onboarding> = {}) =>
  ({
    goal: 'cut_back',
    completedAt: '2026-10-01T09:00:00',
    limits: { weeklyMoney: 50, daysPerWeek: 2, offLimits: [] },
    ...extra,
  }) as Onboarding;
const checkin = (localDate: string, gambled: boolean, amount: number | null = null): DailyCheckin => ({
  localDate,
  mood: 3,
  urge: 3,
  gambled,
  amount,
  action: '',
  slipWhat: '',
  slipDifferent: '',
});

describe('limitsThisWeek', () => {
  it('adds up this week only (a check-in "yes" is about the day before)', () => {
    const s: ProgramState = {
      ...emptyState,
      onboarding: onboarding(),
      // Gambled Sun 4 Oct (last week), Tue 6 and Thu 8 (this week).
      checkins: [checkin('2026-10-05', true, 100), checkin('2026-10-07', true, 20), checkin('2026-10-09', true, 25)],
    };
    expect(limitsThisWeek(s, '2026-10-10')).toEqual({
      spent: 45,
      days: 2,
      weeklyMoney: 50,
      daysPerWeek: 2,
      withinMoney: true,
      withinDays: true,
    });
  });
  it('notices going over', () => {
    const s: ProgramState = {
      ...emptyState,
      onboarding: onboarding(),
      checkins: [checkin('2026-10-06', true, 40), checkin('2026-10-07', true, 20), checkin('2026-10-08', true, null)],
    };
    expect(limitsThisWeek(s, '2026-10-10')).toMatchObject({ spent: 60, days: 3, withinMoney: false, withinDays: false });
  });
  it('is null unless cutting back with limits', () => {
    expect(limitsThisWeek({ ...emptyState, onboarding: onboarding({ goal: 'quit' }) }, '2026-10-10')).toBeNull();
    expect(limitsThisWeek({ ...emptyState, onboarding: onboarding({ limits: null }) }, '2026-10-10')).toBeNull();
  });
  it('treats a missing limit as no limit', () => {
    const s: ProgramState = {
      ...emptyState,
      onboarding: onboarding({ limits: { weeklyMoney: null, daysPerWeek: 1, offLimits: [] } }),
      checkins: [checkin('2026-10-07', true, 500)],
    };
    expect(limitsThisWeek(s, '2026-10-10')).toMatchObject({ withinMoney: true, withinDays: true });
  });
});

describe('breaks', () => {
  const b = breakFor(30, '2026-10-01');
  it('runs from the start for the length chosen', () => {
    expect(b).toEqual({ from: '2026-10-01', until: '2026-10-31' });
  });
  it('knows where they are up to', () => {
    expect(breakStatus(b, '2026-10-01')).toEqual({ day: 1, total: 30, daysLeft: 29, ended: false, until: '2026-10-31' });
    expect(breakStatus(b, '2026-10-10')).toMatchObject({ day: 10, daysLeft: 20, ended: false });
    expect(breakStatus(b, '2026-10-31')).toMatchObject({ day: 30, daysLeft: 0, ended: true });
    expect(breakStatus(null)).toBeNull();
  });
});

describe('goalsForWeek', () => {
  it('swaps in their limits when cutting back', () => {
    const s: ProgramState = { ...emptyState, onboarding: onboarding({ weeklySpend: 140 }), checkins: [checkin('2026-10-07', true, 20)] };
    expect(goalsForWeek(s, '2026-10-10').map((g) => [g.id, g.at, g.of])).toEqual([
      ['sessions', 0, 5],
      ['limitMoney', 20, 50],
      ['limitDays', 1, 2],
    ]);
  });
  it('leaves the usual goals for everyone else', () => {
    const s: ProgramState = { ...emptyState, onboarding: onboarding({ goal: 'quit', weeklySpend: 140 }) };
    expect(goalsForWeek(s, '2026-10-10').map((g) => g.id)).toEqual(['sessions', 'money', 'gambleFree']);
  });
});
