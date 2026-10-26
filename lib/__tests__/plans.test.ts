import { describe, expect, it } from 'vitest';
import { planLine, planNudges, remindLabel, thenSuggestions, whenOptions } from '../plans';
import { emptyState, type IfThenPlan, type Onboarding, type ProgramState } from '../types';

const plan = (id: string, remind: IfThenPlan['remind']): IfThenPlan => ({ id, when: 'Payday', then: 'Save first', remind, createdAt: '' });
const onboarding = { riskyTimes: ['Live sport', 'Payday'], completedAt: '2026-10-01T09:00:00' } as Onboarding;

describe('whenOptions', () => {
  it('puts their own risky times first, with no repeats', () => {
    const list = whenOptions(onboarding);
    expect(list.slice(0, 2)).toEqual(['Live sport', 'Payday']);
    expect(list.filter((w) => w === 'Payday')).toHaveLength(1);
    expect(list).toContain('Friday arvo after work');
  });
});

describe('thenSuggestions', () => {
  it('starts with ideas made for that moment', () => {
    expect(thenSuggestions('Payday')[0]).toBe('Move money into savings first thing');
    expect(thenSuggestions('Something of my own')[0]).toBe('Open Urge SOS and ride it out');
  });
});

describe('remindLabel', () => {
  it('reads naturally', () => {
    expect(remindLabel({ weekday: 5, time: '16:00' })).toBe('Fridays at 4:00pm');
    expect(remindLabel({ weekday: 1, time: '07:30' })).toBe('Mondays at 7:30am');
    expect(remindLabel({ weekday: 0, time: '12:00' })).toBe('Sundays at 12:00pm');
    expect(remindLabel(null)).toBeNull();
  });
});

describe('planNudges', () => {
  const state: ProgramState = { ...emptyState, onboarding, plans: [plan('a', { weekday: 5, time: '16:00' }), plan('b', null)] };
  it('lists the weekly heads-ups', () => {
    expect(planNudges(state, '2026-10-26')).toEqual([{ weekday: 5, hour: 16, minute: 0 }]);
  });
  it('sends nothing while paused', () => {
    expect(planNudges({ ...state, pause: { since: '2026-10-20', until: null } }, '2026-10-26')).toEqual([]);
  });
});

describe('planLine', () => {
  it('reads as one line', () => {
    expect(planLine({ when: "When I'm stressed", then: 'Go for a walk or a run' })).toBe("When I'm stressed → I'll go for a walk or a run");
  });
});
