import { describe, expect, it } from 'vitest';
import { highlightTail, looksLikeEmail, parseMoney, timeLabel } from '@/lib/format';

describe('format', () => {
  it('reads money people type', () => {
    expect(parseMoney('120')).toBe(120);
    expect(parseMoney('$1,250.50')).toBe(1250.5);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('lots')).toBeNull();
    expect(parseMoney('-5')).toBeNull();
  });

  it('shows times and checks emails', () => {
    expect(timeLabel('07:30')).toBe('7:30am');
    expect(timeLabel('12:00')).toBe('12:00pm');
    expect(looksLikeEmail('mate@example.com')).toBe(true);
    expect(looksLikeEmail('mate@')).toBe(false);
  });
});

describe('highlightTail', () => {
  it('lights up the last sentence, or the last word', () => {
    expect(highlightTail('Small choices. Big freedom.')).toEqual(['Small choices. ', 'Big freedom.']);
    expect(highlightTail("Welcome: why you're here")).toEqual(["Welcome: why you're ", 'here']);
    expect(highlightTail('Triggers')).toEqual(['', 'Triggers']);
  });
});
