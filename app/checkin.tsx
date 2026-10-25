import { router } from 'expo-router';
import { useState } from 'react';
import { BounceBack, CheckinQuestions, useCheckin } from '@/components/Checkin';
import { useCrisisGate } from '@/components/Help';
import { Button, Screen, Txt } from '@/components/ui';
import { localDate } from '@/lib/program';
import { lastCheckinDate } from '@/lib/progress';
import { useStore } from '@/lib/store';

// The 1-minute daily check-in for after the program (keeps gamble-free days and the streak counting).
export default function DailyCheckin() {
  const { state, saveCheckin } = useStore();
  const checkin = useCheckin();
  const [step, setStep] = useState<'questions' | 'bounce' | 'done'>('questions');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();
  // Checking in again today replaces today's, so "since your last check-in" looks at the ones before it.
  const lastDate = lastCheckinDate({ ...state, checkins: state.checkins.filter((c) => c.localDate !== localDate()) });

  const save = () =>
    check(checkin.texts, async () => {
      setSaving(true);
      setProblem(null);
      try {
        await saveCheckin({ localDate: localDate(), action: '', ...checkin.result() });
        setStep('done');
      } catch {
        setProblem("That didn't save. Check your internet connection and try again.");
      } finally {
        setSaving(false);
      }
    });

  if (step === 'done')
    return (
      <Screen footer={<Button label="Done" onPress={() => router.replace('/home')} />}>
        <Txt variant="title">Thanks for checking in.</Txt>
        <Txt variant="muted">
          {checkin.gambled ? 'Bouncing back is what counts, and you just did it.' : 'Another day in the bank. See you tomorrow.'}
        </Txt>
      </Screen>
    );

  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          {step === 'questions' && checkin.gambled ? (
            <Button label="Next" onPress={() => setStep('bounce')} disabled={!checkin.complete} />
          ) : (
            <Button label="Save" onPress={save} disabled={!checkin.complete} loading={saving} />
          )}
          <Button label="Back" kind="ghost" onPress={() => (step === 'bounce' ? setStep('questions') : router.back())} />
        </>
      }
    >
      {sheet}
      {step === 'questions' ? <CheckinQuestions f={checkin.fields} lastDate={lastDate} /> : <BounceBack f={checkin.fields} />}
    </Screen>
  );
}
