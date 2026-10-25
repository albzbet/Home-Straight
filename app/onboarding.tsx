import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Choice, Field, Row, Screen, StepBar, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { looksLikeEmail, parseMoney, timeLabel } from '@/lib/format';
import { useStore } from '@/lib/store';
import { space } from '@/lib/theme';
import type { Goal, Onboarding as OnboardingAnswers } from '@/lib/types';

// Seven quick questions (under 3 minutes), then straight into Day 1. Everything except the goal can be skipped.
const STEPS = ['goal', 'why', 'money', 'risky', 'time', 'buddy', 'questions'] as const;
const o = config.onboarding;
const q = config.questionnaire;

const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export default function Onboarding() {
  const { state, saveOnboarding, saveQuestionnaire } = useStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [whys, setWhys] = useState<string[]>([]);
  const [whyText, setWhyText] = useState('');
  const [spend, setSpend] = useState('');
  const [savingFor, setSavingFor] = useState('');
  const [target, setTarget] = useState('');
  const [risky, setRisky] = useState<string[]>([]);
  const [payday, setPayday] = useState('');
  const [habit, setHabit] = useState('');
  const [time, setTime] = useState('07:30');
  const [buddyEmail, setBuddyEmail] = useState('');
  const [buddyConsent, setBuddyConsent] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(q.items.map(() => null));

  const name = STEPS[step]!;
  const buddyOk = !buddyEmail.trim() || (looksLikeEmail(buddyEmail) && buddyConsent);
  const canGo =
    (name === 'goal' && !!goal) ||
    (name === 'why' && (whys.length > 0 || !!whyText.trim())) ||
    name === 'money' ||
    name === 'risky' ||
    name === 'time' ||
    (name === 'buddy' && buddyOk) ||
    (name === 'questions' && answers.every((a) => a !== null));

  const finish = async () => {
    setSaving(true);
    setProblem(null);
    const answersOut: OnboardingAnswers = {
      goal: goal!,
      whyChoices: whys,
      whyText: whyText.trim(),
      weeklySpend: parseMoney(spend),
      savingFor: savingFor.trim(),
      savingTarget: parseMoney(target),
      riskyTimes: risky,
      payday,
      habit: habit.trim(),
      reminderTime: time,
      buddyEmail: buddyConsent ? buddyEmail.trim() : '',
      buddyConsent: buddyConsent && !!buddyEmail.trim(),
      completedAt: new Date().toISOString(),
    };
    try {
      // Only once, even if the onboarding save below needs a second try.
      if (!state.questionnaires.some((x) => x.kind === 'baseline'))
        await saveQuestionnaire({ kind: 'baseline', answers: answers as number[], takenAt: new Date().toISOString() });
      await saveOnboarding(answersOut);
      router.replace('/session/1');
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const optional = name !== 'goal' && name !== 'why' && name !== 'questions';

  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          <Button label={step === STEPS.length - 1 ? 'Start Day 1' : 'Next'} onPress={next} disabled={!canGo} loading={saving} />
          {step > 0 ? <Button label="Back" kind="ghost" onPress={() => setStep(step - 1)} /> : null}
        </>
      }
    >
      <View style={{ gap: space.sm }}>
        <StepBar at={step + 1} of={STEPS.length} />
        <Txt variant="small">
          {step + 1} of {STEPS.length}
          {optional ? ' · you can skip this one' : ''}
        </Txt>
      </View>

      {name === 'goal' && (
        <>
          <Txt variant="title">What would you like to do?</Txt>
          <Txt variant="muted">There's no wrong answer, and you can change it later.</Txt>
          {o.goals.map((g) => (
            <Choice key={g.id} label={g.label} detail={g.detail} selected={goal === g.id} onPress={() => setGoal(g.id as Goal)} />
          ))}
        </>
      )}

      {name === 'why' && (
        <>
          <Txt variant="title">What's your why?</Txt>
          <Txt variant="muted">Pick any that fit, or put it in your own words. We'll remind you of this on the tough days.</Txt>
          {o.whys.map((w) => (
            <Choice key={w} label={w} selected={whys.includes(w)} onPress={() => setWhys(toggle(whys, w))} />
          ))}
          <Field label="In my own words (optional)" value={whyText} onChangeText={setWhyText} multiline maxLength={300} />
        </>
      )}

      {name === 'money' && (
        <>
          <Txt variant="title">Your money goal</Txt>
          <Txt variant="muted">This lets us show you the money you're keeping. A rough guess is fine.</Txt>
          <Field
            label="About how much do you spend on gambling in a usual week?"
            placeholder="$"
            value={spend}
            onChangeText={setSpend}
            keyboardType="decimal-pad"
          />
          <Field
            label="Something you'd like to save towards"
            placeholder="e.g. A trip to Bali"
            value={savingFor}
            onChangeText={setSavingFor}
            maxLength={60}
          />
          <Field label="How much would that cost?" placeholder="$" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
        </>
      )}

      {name === 'risky' && (
        <>
          <Txt variant="title">When is it hardest?</Txt>
          <Txt variant="muted">Pick the times the urge tends to show up. We'll help you plan around them.</Txt>
          {o.riskyTimes.map((r) => (
            <Choice key={r} label={r} selected={risky.includes(r)} onPress={() => setRisky(toggle(risky, r))} />
          ))}
          <Txt variant="h2">How often do you get paid?</Txt>
          <Row>
            {o.paydays.map((p) => (
              <Chip key={p} label={p} selected={payday === p} onPress={() => setPayday(payday === p ? '' : p)} />
            ))}
          </Row>
        </>
      )}

      {name === 'time' && (
        <>
          <Txt variant="title">Your 10 minutes</Txt>
          <Txt variant="muted">Tying it to something you already do each morning makes it stick.</Txt>
          {o.habits.map((h) => (
            <Choice key={h} label={h} selected={habit === h} onPress={() => setHabit(habit === h ? '' : h)} />
          ))}
          <Field label="Or your own" value={o.habits.includes(habit) ? '' : habit} onChangeText={setHabit} maxLength={60} />
          <Txt variant="h2">Remind me at</Txt>
          <Row>
            {o.reminderTimes.map((t) => (
              <Chip key={t} label={timeLabel(t)} selected={time === t} onPress={() => setTime(t)} />
            ))}
          </Row>
        </>
      )}

      {name === 'buddy' && (
        <>
          <Txt variant="title">Want a mate in your corner?</Txt>
          <Txt variant="muted">
            If you like, a mate or partner can get a short weekly email saying how many sessions you've done, with a few words of
            encouragement. It never includes anything about gambling or money. They'll be asked to agree first, and you can turn it off any
            time.
          </Txt>
          <Field
            label="Their email (optional)"
            value={buddyEmail}
            onChangeText={setBuddyEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {buddyEmail.trim() ? (
            <Choice
              label="I'm happy for them to get a weekly summary"
              detail="Sessions done and an encouraging note. Nothing else."
              selected={buddyConsent}
              onPress={() => setBuddyConsent((c) => !c)}
            />
          ) : null}
          {buddyEmail.trim() && !looksLikeEmail(buddyEmail) ? <Txt variant="small">That email doesn't look quite right.</Txt> : null}
        </>
      )}

      {name === 'questions' && (
        <>
          <Txt variant="title">A quick look at where you're at</Txt>
          <Txt variant="muted">
            Nine questions. Only you can see your answers. We'll ask the same ones at the end of the program so you can see what's changed.
          </Txt>
          <Txt variant="h2">{q.intro}</Txt>
          {q.items.map((item, i) => (
            <View key={i} style={{ gap: space.sm }}>
              <Txt>{item}</Txt>
              <Row>
                {q.scale.map((label, value) => (
                  <Chip
                    key={label}
                    label={label}
                    selected={answers[i] === value}
                    onPress={() => setAnswers(answers.map((a, j) => (j === i ? value : a)))}
                  />
                ))}
              </Row>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
