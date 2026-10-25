import { describe, expect, it } from 'vitest';
import { isPin, pinWaitSeconds, shouldRelock } from '@/lib/lockRules';

describe('lock rules', () => {
  it('locks again only after a proper break', () => {
    expect(shouldRelock(null, 100_000)).toBe(false);
    expect(shouldRelock(0, 20_000)).toBe(false);
    expect(shouldRelock(0, 31_000)).toBe(true);
  });

  it('slows down guessing', () => {
    expect([0, 4, 5, 6, 7, 20].map(pinWaitSeconds)).toEqual([0, 0, 30, 60, 120, 900]);
  });

  it('PINs are 4 digits', () => {
    expect(isPin('0420')).toBe(true);
    expect(isPin('42')).toBe(false);
    expect(isPin('12a4')).toBe(false);
  });
});
