import { useState } from 'react';
import { Text, View } from 'react-native';
import { Kelpie } from '@/components/Brand';
import { useCrisisGate } from '@/components/Help';
import { Button, Card, Choice, Field, PrimaryButton, ProgressBar, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { useStore } from '@/lib/store';
import { fonts, space, useTheme } from '@/lib/theme';

const fy = config.futureYou;
const fill = (q: string, horizon: string) => q.replace('{horizon}', horizon);

// "Future you": picture a good day some time from now in real detail, one question at a time, then write a few lines from
// future you to you today. The latest one is kept, and shown on More life and in Urge SOS.
export default function FutureYouScreen() {
  const t = useTheme();
  const { state, saveFutureYou } = useStore();
  const saved = state.futureYou;
  // 'view' shows the saved one; 'start' picks the time; numbers are the questions; 'letter' is the last step.
  const [step, setStep] = useState<'view' | 'start' | number | 'letter'>(saved ? 'view' : 'start');
  const [horizon, setHorizon] = useState(saved?.horizon ?? fy.horizons[1]!);
  const [answers, setAnswers] = useState<string[]>(() => fy.prompts.map((_, i) => saved?.answers[i] ?? ''));
  const [letter, setLetter] = useState(saved?.letter ?? '');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();
  const total = fy.prompts.length + 2;

  const save = () =>
    check([...answers, letter], async () => {
      setSaving(true);
      setProblem(null);
      try {
        await saveFutureYou({ horizon, answers: answers.map((a) => a.trim()), letter: letter.trim(), at: new Date().toISOString() });
        setStep('view');
      } catch {
        setProblem("That didn't save. Check your internet connection and try again.");
      } finally {
        setSaving(false);
      }
    });

  if (step === 'view' && saved) {
    const story = saved.answers.filter(Boolean);
    return (
      <Screen footer={<Button label="Picture it again" kind="secondary" onPress={() => setStep('start')} />}>
        <Txt variant="label">{saved.horizon} from now</Txt>
        <Txt variant="title">Future you</Txt>
        {saved.letter ? (
          <Card raised>
            <Txt variant="label">A note from future you</Txt>
            <Text style={{ fontFamily: fonts.medium, fontSize: 19, lineHeight: 27, color: t.text }}>"{saved.letter}"</Text>
          </Card>
        ) : null}
        {story.length ? (
          <Card>
            <Txt variant="label">What you pictured</Txt>
            {story.map((s, i) => (
              <Txt key={i}>{s}</Txt>
            ))}
          </Card>
        ) : null}
        <Txt variant="muted">Come back to this whenever you need a reminder of where you're heading.</Txt>
      </Screen>
    );
  }

  const at = step === 'start' ? 0 : step === 'letter' ? total - 1 : (step as number) + 1;
  const progress = <ProgressBar at={at + 1} of={total} />;

  if (step === 'start' || step === 'view')
    return (
      <Screen
        footer={
          <>
            <PrimaryButton label="Start" onPress={() => setStep(0)} />
            {saved ? <Button label="Cancel" kind="ghost" onPress={() => setStep('view')} /> : null}
          </>
        }
      >
        {progress}
        <View style={{ alignItems: 'center', paddingTop: space.md }}>
          <Kelpie height={72} />
        </View>
        <Txt variant="title">Future you</Txt>
        <Txt variant="muted">{fy.intro}</Txt>
        <Txt variant="h2">How far ahead?</Txt>
        {fy.horizons.map((h) => (
          <Choice key={h} label={`${h} from now`} selected={horizon === h} onPress={() => setHorizon(h)} />
        ))}
      </Screen>
    );

  if (step === 'letter')
    return (
      <Screen
        footer={
          <>
            {problem ? <Txt variant="small">{problem}</Txt> : null}
            <PrimaryButton label="Save" onPress={save} loading={saving} disabled={!letter.trim() && !answers.some((a) => a.trim())} />
            <Button label="Back" kind="ghost" onPress={() => setStep(fy.prompts.length - 1)} />
          </>
        }
      >
        {sheet}
        {progress}
        <Txt variant="label">A note from future you</Txt>
        <Txt variant="h2">{fy.letter}</Txt>
        <Field placeholder={fy.letterPlaceholder} value={letter} onChangeText={setLetter} multiline maxLength={1000} />
      </Screen>
    );

  const i = step;
  const prompt = fy.prompts[i]!;
  return (
    <Screen
      footer={
        <>
          <PrimaryButton label="Next" onPress={() => check([answers[i]!], () => setStep(i + 1 < fy.prompts.length ? i + 1 : 'letter'))} />
          <Button label="Back" kind="ghost" onPress={() => setStep(i ? i - 1 : 'start')} />
        </>
      }
    >
      {sheet}
      {progress}
      <Txt variant="label">
        {horizon} from now · {i + 1} of {fy.prompts.length}
      </Txt>
      <Txt variant="h2">{fill(prompt.q, horizon)}</Txt>
      <Txt variant="small">Take a moment to picture it first. Skip any that don't fit.</Txt>
      <Field
        placeholder={prompt.placeholder}
        value={answers[i]}
        onChangeText={(v) => setAnswers(answers.map((a, j) => (j === i ? v : a)))}
        multiline
        maxLength={500}
      />
    </Screen>
  );
}
