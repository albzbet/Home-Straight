import { useState } from 'react';
import { Chip, Field, Row, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { parseMoney } from '@/lib/format';
import { localDate } from '@/lib/program';

// The 1-minute check-in and the bounce-back questions, shared by the daily sessions and the after-program daily check-in.

const SLIP_REASONS = [
  ...config.onboarding.riskyTimes.map((r) => r.label),
  'An ad or offer',
  'Trying to win back money',
  'Someone else was betting',
  "I'm not sure",
];

const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export function useCheckin() {
  const [mood, setMood] = useState<number | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [gambled, setGambled] = useState<boolean | null>(null);
  const [amount, setAmount] = useState('');
  const [slipWhat, setSlipWhat] = useState<string[]>([]);
  const [slipNote, setSlipNote] = useState('');
  const [slipDifferent, setSlipDifferent] = useState('');
  return {
    fields: {
      mood,
      setMood,
      urge,
      setUrge,
      gambled,
      setGambled,
      amount,
      setAmount,
      slipWhat,
      setSlipWhat,
      slipNote,
      setSlipNote,
      slipDifferent,
      setSlipDifferent,
    },
    gambled,
    complete: mood !== null && urge !== null && gambled !== null,
    // Free text to run past the crisis check.
    texts: [slipNote, slipDifferent],
    // What gets saved.
    result: () => ({
      mood,
      urge,
      gambled,
      amount: gambled ? parseMoney(amount) : null,
      slipWhat: gambled ? [...slipWhat, slipNote.trim()].filter(Boolean).join('; ') : '',
      slipDifferent: gambled ? slipDifferent.trim() : '',
    }),
  };
}

type Fields = ReturnType<typeof useCheckin>['fields'];

// "Did you gamble yesterday?", or "since your last check-in" when they've been away for a few days.
function gambleQuestion(lastDate: string | undefined): string {
  const yesterday = localDate(new Date(Date.now() - 86_400_000));
  return !lastDate || lastDate >= yesterday ? 'Did you gamble yesterday?' : 'Have you gambled since your last check-in?';
}

export function CheckinQuestions({ f, lastDate }: { f: Fields; lastDate?: string }) {
  return (
    <>
      <Txt variant="title">Quick check-in</Txt>
      <Txt variant="h2">How are you feeling?</Txt>
      <Row>
        {config.checkin.moods.map((m, i) => (
          <Chip key={m} label={m} selected={f.mood === i + 1} onPress={() => f.setMood(i + 1)} />
        ))}
      </Row>
      <Txt variant="h2">How strong is the urge to gamble right now?</Txt>
      <Txt variant="small">0 is none at all, 10 is the strongest it gets.</Txt>
      <Row>
        {Array.from({ length: 11 }, (_, n) => (
          <Chip key={n} label={String(n)} selected={f.urge === n} onPress={() => f.setUrge(n)} />
        ))}
      </Row>
      <Txt variant="h2">{gambleQuestion(lastDate)}</Txt>
      <Row>
        <Chip label="No" selected={f.gambled === false} onPress={() => f.setGambled(false)} />
        <Chip label="Yes" selected={f.gambled === true} onPress={() => f.setGambled(true)} />
      </Row>
      {f.gambled ? (
        <Field
          label="How much, roughly? (optional)"
          placeholder="$"
          value={f.amount}
          onChangeText={f.setAmount}
          keyboardType="decimal-pad"
        />
      ) : null}
    </>
  );
}

// After someone says they gambled: supportive, never a telling-off.
export function BounceBack({ f }: { f: Fields }) {
  return (
    <>
      <Txt variant="title">Thanks for being honest</Txt>
      <Txt variant="muted">
        A slip doesn't wipe out your progress. Every gamble-free day you've had still counts, and you're still here, which is what matters.
        Let's look at what happened so next time can go differently.
      </Txt>
      <Txt variant="h2">What was going on?</Txt>
      <Row>
        {SLIP_REASONS.map((r) => (
          <Chip key={r} label={r} selected={f.slipWhat.includes(r)} onPress={() => f.setSlipWhat(toggle(f.slipWhat, r))} />
        ))}
      </Row>
      <Field label="Anything else? (optional)" value={f.slipNote} onChangeText={f.setSlipNote} multiline maxLength={300} />
      <Txt variant="h2">What could you do differently next time?</Txt>
      <Field
        placeholder="e.g. Leave my card at home on payday"
        value={f.slipDifferent}
        onChangeText={f.setSlipDifferent}
        multiline
        maxLength={300}
      />
    </>
  );
}
