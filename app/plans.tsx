import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useCrisisGate } from '@/components/Help';
import { Button, Card, Chip, Choice, Field, PrimaryButton, Row, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { timeLabel } from '@/lib/format';
import { remindLabel, thenSuggestions, WEEKDAYS, whenOptions } from '@/lib/plans';
import { remindersSupported } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { fonts, space, useTheme } from '@/lib/theme';
import type { IfThenPlan } from '@/lib/types';

const MAX_PLANS = 20;

// One plan, as "IF ... THEN I'LL ...".
function PlanText({ when, then }: { when: string; then: string }) {
  const t = useTheme();
  const label = { fontFamily: fonts.display, fontSize: 18, letterSpacing: 0.5, color: t.primary };
  return (
    <View style={{ gap: 2 }}>
      <Text style={label}>IF</Text>
      <Txt style={{ fontFamily: fonts.semibold }}>{when}</Txt>
      <Text style={[label, { marginTop: space.xs }]}>THEN I'LL</Text>
      <Txt style={{ fontFamily: fonts.semibold }}>{then}</Txt>
    </View>
  );
}

// If-then plans: decide ahead what you'll do in a risky moment, so there's nothing to decide in the moment.
// List, then a three-step builder: the moment, what you'll do instead, and an optional weekly heads-up.
export default function Plans() {
  const t = useTheme();
  const { state, savePlan, deletePlan } = useStore();
  const [step, setStep] = useState<'list' | 'when' | 'then' | 'remind'>('list');
  const [draft, setDraft] = useState<IfThenPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();
  const own = new Set(state.onboarding?.riskyTimes ?? []);

  const start = (p?: IfThenPlan) => {
    setDraft(p ?? { id: `plan-${Date.now()}`, when: '', then: '', remind: null, createdAt: new Date().toISOString() });
    setProblem(null);
    setStep('when');
  };
  const set = (patch: Partial<IfThenPlan>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setProblem(null);
    try {
      await savePlan({ ...draft, when: draft.when.trim(), then: draft.then.trim() });
      setStep('list');
      setDraft(null);
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setProblem(null);
    try {
      await deletePlan(id);
    } catch {
      setProblem("That didn't go through. Check your internet connection and try again.");
    }
  };

  if (step === 'list' || !draft)
    return (
      <Screen
        footer={
          <>
            {problem ? <Txt variant="small">{problem}</Txt> : null}
            {state.plans.length < MAX_PLANS ? <PrimaryButton label="Make a plan" icon="add" onPress={() => start()} /> : null}
          </>
        }
      >
        <Txt variant="title">If-then plans</Txt>
        <Txt variant="muted">
          Decide now what you'll do when a risky moment comes, so there's nothing to decide in the moment. Plans this specific are much more
          likely to happen.
        </Txt>
        {state.plans.length ? (
          state.plans.map((p) => (
            <Card key={p.id}>
              <PlanText when={p.when} then={p.then} />
              {p.remind ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                  <Ionicons name="notifications-outline" size={14} color={t.textMuted} />
                  <Txt variant="small">Heads-up {remindLabel(p.remind)}</Txt>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <View style={{ flex: 1 }}>
                  <Button label="Change" kind="ghost" onPress={() => start(p)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Remove" kind="ghost" onPress={() => remove(p.id)} />
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card>
            <Txt variant="label">For example</Txt>
            <PlanText when="Payday" then="Move money into savings first thing" />
          </Card>
        )}
      </Screen>
    );

  if (step === 'when') {
    const options = whenOptions(state.onboarding);
    const custom = options.includes(draft.when) ? '' : draft.when;
    return (
      <Screen
        footer={
          <>
            <PrimaryButton label="Next" onPress={() => check([draft.when], () => setStep('then'))} disabled={!draft.when.trim()} />
            <Button label="Cancel" kind="ghost" onPress={() => setStep('list')} />
          </>
        }
      >
        {sheet}
        <Txt variant="label">Step 1 of 3</Txt>
        <Txt variant="title">If…</Txt>
        <Txt variant="muted">Pick a moment that can be risky for you.</Txt>
        {options.map((w) => (
          <Choice
            key={w}
            label={w}
            badge={own.has(w) ? 'Yours' : undefined}
            selected={draft.when === w}
            onPress={() => set({ when: w, then: draft.when === w ? draft.then : '' })}
          />
        ))}
        <Field
          label="Or in your own words"
          placeholder="e.g. Sunday nights"
          value={custom}
          onChangeText={(when) => set({ when })}
          maxLength={120}
        />
      </Screen>
    );
  }

  if (step === 'then') {
    const ideas = thenSuggestions(draft.when);
    const custom = ideas.includes(draft.then) ? '' : draft.then;
    return (
      <Screen
        footer={
          <>
            <PrimaryButton label="Next" onPress={() => check([draft.then], () => setStep('remind'))} disabled={!draft.then.trim()} />
            <Button label="Back" kind="ghost" onPress={() => setStep('when')} />
          </>
        }
      >
        {sheet}
        <Txt variant="label">Step 2 of 3 · {draft.when}</Txt>
        <Txt variant="title">Then I'll…</Txt>
        <Txt variant="muted">Something you can actually do in that moment. The more specific, the better.</Txt>
        {ideas.map((i) => (
          <Choice key={i} label={i} selected={draft.then === i} onPress={() => set({ then: i })} />
        ))}
        <Field
          label="Or in your own words"
          placeholder="e.g. Take the dog to the beach"
          value={custom}
          onChangeText={(then) => set({ then })}
          maxLength={200}
        />
      </Screen>
    );
  }

  // Step 3: an optional weekly heads-up, then save.
  const remind = draft.remind;
  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          <PrimaryButton label="Save my plan" onPress={save} loading={saving} />
          <Button label="Back" kind="ghost" onPress={() => setStep('then')} />
        </>
      }
    >
      <Txt variant="label">Step 3 of 3</Txt>
      <Txt variant="title">A heads-up?</Txt>
      <Txt variant="muted">
        If this moment comes round on a set day, we can give you a nudge each week just before. It never mentions gambling.
      </Txt>
      <Row>
        <Chip label="No thanks" selected={!remind} onPress={() => set({ remind: null })} />
        {WEEKDAYS.map((d, i) => (
          <Chip
            key={d}
            label={d}
            selected={remind?.weekday === i}
            onPress={() => set({ remind: { weekday: i, time: remind?.time ?? config.plans.times[2]! } })}
          />
        ))}
      </Row>
      {remind ? (
        <Row>
          {config.plans.times.map((time) => (
            <Chip key={time} label={timeLabel(time)} selected={remind.time === time} onPress={() => set({ remind: { ...remind, time } })} />
          ))}
        </Row>
      ) : null}
      {remind && !remindersSupported ? <Txt variant="small">Heads-ups work in the phone app, not on the web.</Txt> : null}
      {remind && remindersSupported ? (
        <Txt variant="small">Make sure reminders are turned on (Home or Settings), or the heads-up can't arrive.</Txt>
      ) : null}
      <Card raised>
        <PlanText when={draft.when} then={draft.then} />
        {remind ? <Txt variant="small">Heads-up {remindLabel(remind)}</Txt> : null}
      </Card>
    </Screen>
  );
}
