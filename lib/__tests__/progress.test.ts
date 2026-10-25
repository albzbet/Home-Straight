import { describe, expect, it } from 'vitest';
import { lastCheckinDate, progress } from '@/lib/progress';
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
