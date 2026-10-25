import { describe, expect, it } from 'vitest';
import { moneyInsight, pickInsights } from '@/lib/insights';

const card = (title: string) => ({ title, text: `${title} text` });
const options = [
  { label: 'Pokies', insight: card('Pokies') },
  { label: 'Sport', insight: card('Sport') },
  { label: 'Family', insight: card('Family') },
  { label: 'Partner', insight: card('Family') },
  { label: 'Other' },
];
const fallback = card('Fallback');

describe('pickInsights', () => {
  it('follows the order people tapped, at most two', () => {
    expect(pickInsights(options, ['Sport', 'Pokies', 'Family'], fallback).map((i) => i.title)).toEqual(['Sport', 'Pokies']);
  });

  it('shows a shared card once', () => {
    expect(pickInsights(options, ['Family', 'Partner'], fallback).map((i) => i.title)).toEqual(['Family']);
  });

  it('falls back when nothing picked has a card', () => {
    expect(pickInsights(options, [], fallback)).toEqual([fallback]);
    expect(pickInsights(options, ['Other'], fallback)).toEqual([fallback]);
  });
});

describe('moneyInsight', () => {
  const text = {
    title: 'What you could keep',
    withSpend: 'At about {weekly} a week, eight weeks is {programTotal}.',
    withGoal: '{savingFor} ({target}) in about {weeks} weeks.',
    noSpend: 'No worries.',
  };

  it('does the maths', () => {
    expect(moneyInsight(text, 150, 3000, 'Bali').text).toBe(
      'At about $150 a week, eight weeks is $1,200. Bali ($3,000) in about 20 weeks.',
    );
    expect(moneyInsight(text, 150, null, '').text).toBe('At about $150 a week, eight weeks is $1,200.');
    expect(moneyInsight(text, 40, 100, '').text).toContain('your goal ($100) in about 3 weeks');
  });

  it('is kind when there is no spend', () => {
    expect(moneyInsight(text, null, 3000, 'Bali').text).toBe('No worries.');
  });
});
