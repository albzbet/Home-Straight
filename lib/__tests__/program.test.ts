import { describe, expect, it } from 'vitest';
import { localDate, nextDay, today, TOTAL_DAYS, weekOf } from '@/lib/program';
import type { DayRecord } from '@/lib/types';

const done = (day: number, date: string): DayRecord => ({
  day,
  localDate: date,
  completedAt: `${date}T08:00:00Z`,
  busy: false,
  mood: 3,
  urge: 2,
  gambled: false,
  amount: null,
  action: '',
});

describe('program', () => {
  it('starts on day 1, open straight away', () => {
    expect(today([], '2026-10-25')).toEqual({ day: 1, unlocked: true });
  });

  it('opens the next day only on a later date', () => {
    const days = [done(1, '2026-10-25')];
    expect(today(days, '2026-10-25')).toEqual({ day: 2, unlocked: false });
    expect(today(days, '2026-10-26')).toEqual({ day: 2, unlocked: true });
  });

  it('missed days wait: after a week away you pick up where you left off', () => {
    const days = [done(1, '2026-10-01'), done(2, '2026-10-02')];
    expect(today(days, '2026-10-20')).toEqual({ day: 3, unlocked: true });
  });

  it('is finished after all 42', () => {
    const days = Array.from({ length: TOTAL_DAYS }, (_, i) => done(i + 1, '2026-10-01'));
    expect(nextDay(days)).toBeNull();
    expect(today(days).day).toBeNull();
  });

  it('works out weeks and dates', () => {
    expect([1, 7, 8, 42].map(weekOf)).toEqual([1, 1, 2, 6]);
    expect(localDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
