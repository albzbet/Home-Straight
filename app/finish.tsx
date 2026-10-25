import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCrisisGate } from '@/components/Help';
import { blankAnswers, Questions } from '@/components/Questions';
import { Stat } from '@/components/Stat';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { money } from '@/lib/format';
import { progress } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { questionnaireChange } from '@/lib/summary';
import { space } from '@/lib/theme';

// After the last week: the same private questions as at the start, then how far they've come. Never a score or a label.
export default function Finish() {
  const { state, saveQuestionnaire } = useStore();
  const done = state.questionnaires.some((q) => q.kind === 'end');
  const [answers, setAnswers] = useState(blankAnswers);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { sheet } = useCrisisGate();

  if (!done)
    return (
      <Screen
        footer={
          <>
            {problem ? <Txt variant="small">{problem}</Txt> : null}
            <Button
              label="See how far I've come"
              disabled={answers.some((a) => a === null)}
              loading={saving}
              onPress={async () => {
                setSaving(true);
                setProblem(null);
                try {
                  await saveQuestionnaire({ kind: 'end', answers: answers as number[], takenAt: new Date().toISOString() });
                } catch {
                  setProblem("That didn't save. Check your internet connection and try again.");
                } finally {
                  setSaving(false);
                }
              }}
            />
          </>
        }
      >
        {sheet}
        <Txt variant="title">One last look</Txt>
        <Txt variant="muted">The same nine questions you answered at the start. Only you see them.</Txt>
        <Questions answers={answers} onChange={setAnswers} />
      </Screen>
    );

  const change = questionnaireChange(state);
  const p = progress(state);
  const handled = state.urges.filter((u) => u.passed !== 'gambled').length;
  return (
    <Screen footer={<Button label="See my game plan" onPress={() => router.push('/plan')} />}>
      <Txt variant="title">Eight weeks. Look at that.</Txt>
      {change ? (
        <Card>
          <Txt variant="label">Compared with when you started</Txt>
          <Txt variant="h2">
            {change.better > 0
              ? `Things look better on ${change.better} of ${change.better + change.same + change.worse} questions.`
              : 'Your answers are about the same as when you started.'}
          </Txt>
          <Txt variant="muted">
            {change.worse > 0
              ? `${change.worse} ${change.worse === 1 ? 'is' : 'are'} tougher than before. That's worth talking through with Gambling Help Online, any time.`
              : 'Change takes time, and you showed up for eight weeks. Keep going.'}
          </Txt>
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Stat value={String(state.days.length)} label="sessions done" />
        <Stat value={String(p.gambleFreeDays)} label="gamble-free days" />
        <Stat value={String(handled)} label={handled === 1 ? 'urge ridden out' : 'urges ridden out'} />
        {state.onboarding?.weeklySpend ? <Stat value={money(p.moneyKept)} label="money kept (estimate)" /> : null}
      </View>
      <Txt variant="muted">Your game plan pulls together what's worked for you. Save it as a PDF and keep it handy.</Txt>
    </Screen>
  );
}
