import { Chip, Choice, Field, Row, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { parseMoney } from '@/lib/format';
import { BREAK_LENGTHS } from '@/lib/goalPlan';
import type { GoalLimits } from '@/lib/types';

// The details that go with "Cut back" (their own limits) and "Take a break" (how long), used in setup and on the
// "What you're aiming for" screen.

export type LimitsDraft = { money: string; days: number | null; off: string[] };

export const limitsDraft = (l: GoalLimits | null | undefined): LimitsDraft => ({
  money: l?.weeklyMoney != null ? String(l.weeklyMoney) : '',
  days: l?.daysPerWeek ?? null,
  off: l?.offLimits ?? [],
});

export const limitsFrom = (d: LimitsDraft): GoalLimits => ({ weeklyMoney: parseMoney(d.money), daysPerWeek: d.days, offLimits: d.off });

// At least one limit, and a money limit (if given) that makes sense.
export const limitsOk = (d: LimitsDraft) => (!d.money.trim() || parseMoney(d.money) !== null) && (!!parseMoney(d.money) || d.days !== null);

const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export function LimitsFields({ value, onChange }: { value: LimitsDraft; onChange: (d: LimitsDraft) => void }) {
  return (
    <>
      <Txt variant="muted">
        Limits set now, with a clear head, hold much better than ones made in the moment. Set at least one. You can change them any time.
      </Txt>
      <Field
        label="The most I'll spend on gambling in a week"
        placeholder="$"
        value={value.money}
        onChangeText={(money) => onChange({ ...value, money })}
        keyboardType="decimal-pad"
      />
      {value.money.trim() && parseMoney(value.money) === null ? <Txt variant="small">That amount doesn't look quite right.</Txt> : null}
      <Txt variant="h2">The most days I'll gamble in a week</Txt>
      <Row>
        <Chip label="No limit" selected={value.days === null} onPress={() => onChange({ ...value, days: null })} />
        {[1, 2, 3, 4].map((n) => (
          <Chip key={n} label={String(n)} selected={value.days === n} onPress={() => onChange({ ...value, days: n })} />
        ))}
      </Row>
      <Txt variant="h2">Off limits for me</Txt>
      <Txt variant="small">Any kinds of gambling you're ruling out completely. Optional.</Txt>
      {config.onboarding.gamblingTypes
        .map((g) => g.label)
        .filter((g) => g !== 'Something else')
        .map((g) => (
          <Choice key={g} label={g} selected={value.off.includes(g)} onPress={() => onChange({ ...value, off: toggle(value.off, g) })} />
        ))}
    </>
  );
}

export function BreakFields({ days, onChange }: { days: number | null; onChange: (days: number) => void }) {
  return (
    <>
      <Txt variant="muted">
        A set length gives you a clear finish line. When it's up, we'll ask how it went and what you'd like to do next.
      </Txt>
      <Row>
        {BREAK_LENGTHS.map((b) => (
          <Chip key={b.days} label={b.label} selected={days === b.days} onPress={() => onChange(b.days)} />
        ))}
      </Row>
    </>
  );
}
