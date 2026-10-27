import { router } from 'expo-router';
import { useState } from 'react';
import { BreakFields, LimitsFields, limitsDraft, limitsFrom, limitsOk } from '@/components/GoalDetails';
import { Button, Card, Choice, PrimaryButton, ProgressBar, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { breakFor, breakStatus } from '@/lib/goalPlan';
import { useStore } from '@/lib/store';
import type { Goal } from '@/lib/types';

const dateLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' });

// What you're aiming for: stop completely (recommended), cut back with your own limits, or take a break for a set time.
// Change it any time, e.g. when a break ends. From Home's limits / break card and More.
export default function Aim() {
  const { state, saveOnboarding } = useStore();
  const o = state.onboarding;
  const [goal, setGoal] = useState<Goal | null>(o?.goal ?? null);
  const [limits, setLimits] = useState(limitsDraft(o?.limits));
  const current = o?.goal === 'break' ? breakStatus(o.break) : null;
  // A new break length starts today; keeping the current break needs no choice.
  const [breakDays, setBreakDays] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!o) return null;

  const keepBreak = goal === 'break' && !!current && !current.ended && breakDays === null;
  const ok = goal === 'quit' || (goal === 'cut_back' && limitsOk(limits)) || (goal === 'break' && (keepBreak || breakDays !== null));

  const save = async () => {
    if (!goal) return;
    setSaving(true);
    setProblem(null);
    try {
      await saveOnboarding({
        ...o,
        goal,
        limits: goal === 'cut_back' ? limitsFrom(limits) : null,
        break: goal !== 'break' ? null : breakDays ? breakFor(breakDays) : (o.break ?? null),
      });
      router.back();
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          <PrimaryButton label="Save" onPress={save} disabled={!ok} loading={saving} />
          <Button label="Cancel" kind="ghost" onPress={() => router.back()} />
        </>
      }
    >
      <Txt variant="title">What you're aiming for</Txt>
      {current?.ended ? (
        <Card raised>
          <Txt variant="h2">Your break is done</Txt>
          <Txt>
            You made it to {dateLabel(current.until)}. Take a moment to notice what's been different: your money, your sleep, your mood.
            Then choose what comes next. Many people find stopping completely is the easiest line to hold.
          </Txt>
        </Card>
      ) : (
        <Txt variant="muted">
          We recommend stopping completely: a clear line is easier to hold. But it's your call, and you can change it any time.
        </Txt>
      )}
      {config.onboarding.goals.map((g) => (
        <Choice
          key={g.id}
          label={g.label}
          detail={g.detail}
          badge={'recommended' in g && g.recommended ? 'Recommended' : undefined}
          selected={goal === g.id}
          onPress={() => setGoal(g.id as Goal)}
        />
      ))}

      {goal === 'cut_back' ? (
        <>
          <Txt variant="h2">Your limits</Txt>
          <LimitsFields value={limits} onChange={setLimits} />
        </>
      ) : null}

      {goal === 'break' ? (
        <>
          <Txt variant="h2">{current && !current.ended ? 'Your break' : 'How long a break?'}</Txt>
          {current && !current.ended ? (
            <Card>
              <Txt>
                Day {current.day} of {current.total}, until {dateLabel(current.until)}.
              </Txt>
              <ProgressBar at={current.day} of={current.total} />
              <Txt variant="small">To change it, pick a new length below. It starts from today.</Txt>
            </Card>
          ) : null}
          <BreakFields days={breakDays} onChange={setBreakDays} />
        </>
      ) : null}
    </Screen>
  );
}
