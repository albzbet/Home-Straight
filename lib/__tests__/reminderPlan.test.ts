import { describe, expect, it } from 'vitest';
import { isPaused, reminderPlan } from '@/lib/reminderPlan';
import { localDate } from '@/lib/program';
import { emptyState, type DayRecord, type ProgramState } from '@/lib/types';

const onboarding = { ...({} as NonNullable<ProgramState['onboarding']>), reminderTime: '07:30', completedAt: '2026-10-01T09:00:00' };
const done = (day: number, date: string): DayRecord => ({
  day,
  localDate: date,
  completedAt: `${date}T08:00:00`,
  busy: false,
  mood: 3,
  urge: 1,
  gambled: false,
  amount: null,
  action: '',
});
const state = (extra: Partial<ProgramState> = {}): ProgramState => ({ ...emptyState, onboarding, ...extra });
const show = (plan: ReturnType<typeof reminderPlan>) => plan.map((p) => `${p.kind} ${localDate(p.at)}`);
const at = (s: string) => new Date(s);

describe('reminderPlan', () => {
  it('reminds the next mornings, then one welcome back', () => {
    const plan = reminderPlan(state({ days: [done(1, '2026-10-05')] }), at('2026-10-05T10:00:00'));
    expect(show(plan)).toEqual(['daily 2026-10-06', 'daily 2026-10-07', 'welcomeBack 2026-10-08']);
    expect(plan[0]!.at.getHours()).toBe(7);
    expect(plan[0]!.at.getMinutes()).toBe(30);
  });

  it("includes this morning when it hasn't happened yet and today's session isn't done", () => {
    const plan = reminderPlan(state({ days: [done(1, '2026-10-05')] }), at('2026-10-06T06:00:00'));
    expect(show(plan)).toEqual(['daily 2026-10-06', 'daily 2026-10-07', 'welcomeBack 2026-10-08']);
  });

  it('after a long gap: just one welcome back, tomorrow', () => {
    const plan = reminderPlan(state({ days: [done(1, '2026-10-01')] }), at('2026-10-20T12:00:00'));
    expect(show(plan)).toEqual(['welcomeBack 2026-10-21']);
  });

  it('paused: nothing, or one note when a timed pause ends', () => {
    const now = at('2026-10-05T10:00:00');
    expect(reminderPlan(state({ pause: { since: '2026-10-04', until: null } }), now)).toEqual([]);
    expect(show(reminderPlan(state({ pause: { since: '2026-10-04', until: '2026-10-11' } }), now))).toEqual(['resume 2026-10-11']);
    expect(isPaused(state({ pause: { since: '2026-10-04', until: '2026-10-05' } }), '2026-10-05')).toBe(false);
  });

  it('nothing before onboarding or after the program', () => {
    expect(reminderPlan(emptyState, at('2026-10-05T10:00:00'))).toEqual([]);
    const all = Array.from({ length: 42 }, (_, i) => done(i + 1, '2026-10-01'));
    expect(reminderPlan(state({ days: all }), at('2026-10-05T10:00:00'))).toEqual([]);
  });
});
