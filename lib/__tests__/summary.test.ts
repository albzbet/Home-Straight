import { describe, expect, it } from 'vitest';
import { gamePlan, questionnaireChange, weekSummary } from '@/lib/summary';
import { emptyState, type DayRecord, type Onboarding, type ProgramState, type UrgeLog } from '@/lib/types';

const onboarding = {
  ...({} as Onboarding),
  weeklySpend: 70,
  whyChoices: ['My kids'],
  whyText: '',
  riskyTimes: ['Payday'],
  buddyEmail: 'mate@example.com',
  completedAt: '2026-10-01T09:00:00',
};
const day = (n: number, date: string, extra: Partial<DayRecord> = {}): DayRecord => ({
  day: n,
  localDate: date,
  completedAt: `${date}T08:00:00`,
  busy: false,
  mood: 3,
  urge: 2,
  gambled: false,
  amount: null,
  action: '',
  ...extra,
});
const urge = (at: string, passed: UrgeLog['passed'], helped: string[] = [], triggers: string[] = []): UrgeLog => ({
  at,
  seconds: 300,
  triggers,
  passed,
  helped,
  note: '',
});
const week1 = Array.from({ length: 7 }, (_, i) => day(i + 1, `2026-10-0${i + 1}`, { mood: i < 4 ? 3 : 5 }));

describe('weekSummary', () => {
  it('adds up the week', () => {
    const s: ProgramState = {
      ...emptyState,
      onboarding,
      days: week1,
      urges: [urge('2026-10-03T20:00:00', 'yes'), urge('2026-10-09T20:00:00', 'yes')],
    };
    expect(weekSummary(s, 1)).toEqual({ week: 1, sessions: 7, urgesHandled: 1, gambleFreeDays: 7, moneyKept: 70, averageMood: 3.9 });
  });

  it('counts a slip in the week', () => {
    const days = week1.map((d) => (d.day === 4 ? { ...d, gambled: true } : d));
    expect(weekSummary({ ...emptyState, onboarding, days }, 1)).toMatchObject({ gambleFreeDays: 6, moneyKept: 60 });
  });

  it('week 2 starts the day after week 1 ended', () => {
    const days = [...week1, day(8, '2026-10-10'), day(14, '2026-10-12')];
    expect(weekSummary({ ...emptyState, onboarding, days }, 2)).toMatchObject({ sessions: 2, gambleFreeDays: 5 });
  });
});

describe('questionnaireChange', () => {
  it('compares question by question', () => {
    const s: ProgramState = {
      ...emptyState,
      questionnaires: [
        { kind: 'baseline', answers: [3, 2, 1, 0], takenAt: '' },
        { kind: 'end', answers: [1, 2, 2, 0], takenAt: '' },
      ],
    };
    expect(questionnaireChange(s)).toEqual({ better: 1, same: 2, worse: 1 });
    expect(questionnaireChange(emptyState)).toBeNull();
  });
});

describe('gamePlan', () => {
  it('pulls the plan together, most common first', () => {
    const s: ProgramState = {
      ...emptyState,
      onboarding,
      days: [
        day(1, '2026-10-01', { action: 'Walk the dog' }),
        day(2, '2026-10-02', { action: 'Walk the dog', slipDifferent: 'Card at home' }),
      ],
      urges: [urge('2026-10-01T20:00:00', 'yes', ['Breathing'], ['Bored']), urge('2026-10-02T20:00:00', 'yes', ['Breathing', 'Calling'])],
    };
    const plan = gamePlan(s);
    expect(plan.why).toEqual(['My kids']);
    expect(plan.triggers).toEqual(['Payday', 'Bored']);
    expect(plan.whatHelps).toEqual(['Breathing', 'Calling']);
    expect(plan.myActions).toEqual(['Walk the dog']);
    expect(plan.ifISlip).toEqual(['Card at home']);
    expect(plan.support[0]).toBe('My buddy');
  });
});
