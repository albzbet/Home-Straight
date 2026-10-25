import { describe, expect, it } from 'vitest';
import type { Mission } from '../content';
import { isDone, missionOfTheWeek, mondayOf, timesDone } from '../missions';
import { emptyState, type ProgramState } from '../types';

const missions: Mission[] = ['a', 'b', 'c'].map((id) => ({ id, title: id, body: '', ideas: [] }));
// Started on Wednesday 7 Oct 2026 (that week's Monday is 5 Oct).
const state = (extra: Partial<ProgramState> = {}): ProgramState => ({
  ...emptyState,
  onboarding: { completedAt: '2026-10-07T09:00:00' } as ProgramState['onboarding'],
  ...extra,
});

describe('mondayOf', () => {
  it('gives the Monday', () => {
    expect(mondayOf('2026-10-07')).toBe('2026-10-05');
    expect(mondayOf('2026-10-05')).toBe('2026-10-05');
    expect(mondayOf('2026-10-11')).toBe('2026-10-05'); // Sunday
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
  });
});

describe('missionOfTheWeek', () => {
  it('starts with the first mission in the week the program started', () => {
    expect(missionOfTheWeek(missions, state(), '2026-10-07')?.mission.id).toBe('a');
    expect(missionOfTheWeek(missions, state(), '2026-10-11')?.mission.id).toBe('a');
  });
  it('moves on each Monday and goes round again after the last', () => {
    expect(missionOfTheWeek(missions, state(), '2026-10-12')?.mission.id).toBe('b');
    expect(missionOfTheWeek(missions, state(), '2026-10-19')?.mission.id).toBe('c');
    expect(missionOfTheWeek(missions, state(), '2026-10-26')?.mission.id).toBe('a');
  });
  it('knows when this week is done', () => {
    const s = state({ missions: [{ missionId: 'b', weekOf: '2026-10-12', at: '2026-10-14T10:00:00Z' }] });
    expect(missionOfTheWeek(missions, s, '2026-10-15')).toMatchObject({ weekOf: '2026-10-12', done: true });
    expect(missionOfTheWeek(missions, s, '2026-10-19')?.done).toBe(false);
  });
  it('copes with no missions', () => {
    expect(missionOfTheWeek([], state(), '2026-10-07')).toBeNull();
  });
});

describe('isDone and timesDone', () => {
  const s = state({
    missions: [
      { missionId: 'a', weekOf: '2026-10-05', at: '' },
      { missionId: 'a', weekOf: '2026-10-26', at: '' },
    ],
  });
  it('counts', () => {
    expect(isDone(s, 'a', '2026-10-26')).toBe(true);
    expect(isDone(s, 'a', '2026-10-12')).toBe(false);
    expect(timesDone(s, 'a')).toBe(2);
    expect(timesDone(s, 'b')).toBe(0);
  });
});
