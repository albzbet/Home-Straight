import { describe, expect, it } from 'vitest';
import { loopChoices, loopLines } from '@/lib/loop';
import { emptyState, type Onboarding, type ProgramState, type UrgeLog } from '@/lib/types';

const urge = (triggers: string[]): UrgeLog => ({ at: '2026-10-10T20:00:00Z', seconds: 60, triggers, passed: 'yes', helped: [], note: '' });

describe('loopChoices', () => {
  const state: ProgramState = {
    ...emptyState,
    onboarding: { riskyTimes: ['Payday'] } as Onboarding,
    urges: [urge(['Live sport', 'Bored']), urge(['Bored']), urge(['Not sure'])],
  };
  it('puts their own triggers first: setup, then Urge SOS most often first', () => {
    const { options, yours } = loopChoices('triggers', state);
    expect(options.slice(0, 3)).toEqual(['Payday', 'Bored', 'Live sport']);
    expect([...yours]).toEqual(['Payday', 'Bored', 'Live sport']);
    expect(options.filter((o) => o === 'Payday')).toHaveLength(1);
    expect(options).not.toContain('Not sure');
  });
  it('keeps their own words as choices', () => {
    expect(loopChoices('thoughts', state, ['Nobody will know']).options.at(-1)).toBe('Nobody will know');
  });
});

describe('loopLines', () => {
  it('makes one line per filled step', () => {
    const lines = loopLines({
      triggers: ['Payday'],
      thoughts: [],
      feelings: ['Stressed', 'Bored'],
      where: [],
      payoffs: [],
      costs: ['Money gone'],
      helped: ' Leaving my card at home ',
      at: '',
    });
    expect(lines).toEqual([
      'What sets it off: Payday',
      'How I feel: Stressed, Bored',
      'What it costs me: Money gone',
      "What's helped before: Leaving my card at home",
    ]);
    expect(loopLines(null)).toEqual([]);
  });
});
