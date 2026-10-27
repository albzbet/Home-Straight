import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Kelpie } from '@/components/Brand';
import { BounceBack, CheckinQuestions, MoodPicker, useCheckin } from '@/components/Checkin';
import { useCrisisGate } from '@/components/Help';
import { Button, Field, PrimaryButton, Screen, Txt } from '@/components/ui';
import { localDate } from '@/lib/program';
import { lastCheckinDate } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { space, useTheme } from '@/lib/theme';

// The 1-minute daily check-in (mockup screen 7): mood faces and an optional note, then the urge and "did you gamble?"
// (which keeps gamble-free days and the streak counting), then bounce-back questions after a slip.
export default function DailyCheckin() {
  const t = useTheme();
  const { state, saveCheckin } = useStore();
  const checkin = useCheckin(state.onboarding?.goal === 'cut_back');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'mood' | 'questions' | 'bounce' | 'done'>('mood');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();
  // Checking in again today replaces today's, so "since your last check-in" looks at the ones before it.
  const lastDate = lastCheckinDate({ ...state, checkins: state.checkins.filter((c) => c.localDate !== localDate()) });

  const save = () =>
    check([...checkin.texts, note], async () => {
      setSaving(true);
      setProblem(null);
      try {
        await saveCheckin({ localDate: localDate(), action: '', ...checkin.result(), note: note.trim() });
        setStep('done');
      } catch {
        setProblem("That didn't save. Check your internet connection and try again.");
      } finally {
        setSaving(false);
      }
    });

  if (step === 'done')
    return (
      <Screen footer={<PrimaryButton label="Done" onPress={() => router.replace('/home')} />}>
        <View style={{ alignItems: 'center', gap: space.md, paddingTop: space.xxl }}>
          <MaterialCommunityIcons name="check-circle" size={72} color={t.success} />
          <Txt variant="title" style={{ textAlign: 'center' }}>
            Thanks for checking in
          </Txt>
          <Txt variant="muted" style={{ textAlign: 'center' }}>
            {checkin.slip
              ? 'Bouncing back is what counts, and you just did it.'
              : checkin.gambled
                ? 'Sticking to your limits takes real effort. Good on you.'
                : 'Another day in the bank. See you tomorrow.'}
          </Txt>
        </View>
      </Screen>
    );

  if (step === 'mood')
    return (
      <Screen
        footer={
          <>
            <PrimaryButton label="Next" onPress={() => check([note], () => setStep('questions'))} disabled={checkin.fields.mood === null} />
            <Button label="Back" kind="ghost" onPress={() => router.back()} />
          </>
        }
      >
        {sheet}
        <View style={{ alignItems: 'center', gap: space.sm, paddingTop: space.lg, paddingBottom: space.md }}>
          <Kelpie height={84} />
          <Txt variant="title" style={{ textAlign: 'center' }}>
            How are you today?
          </Txt>
          <Txt variant="muted" style={{ textAlign: 'center' }}>
            Quick and simple. No wrong answers.
          </Txt>
        </View>
        <MoodPicker value={checkin.fields.mood} onChange={checkin.fields.setMood} />
        <Field
          label="Add a quick note (optional)"
          placeholder="What's on your mind?"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={300}
        />
      </Screen>
    );

  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          {step === 'questions' && checkin.slip ? (
            <PrimaryButton label="Next" onPress={() => setStep('bounce')} disabled={!checkin.complete} />
          ) : (
            <PrimaryButton label="Save" onPress={save} disabled={!checkin.complete} loading={saving} />
          )}
          <Button label="Back" kind="ghost" onPress={() => setStep(step === 'bounce' ? 'questions' : 'mood')} />
        </>
      }
    >
      {sheet}
      {step === 'questions' ? (
        <>
          <Txt variant="title">Two more quick ones</Txt>
          <CheckinQuestions f={checkin.fields} lastDate={lastDate} withMood={false} />
        </>
      ) : (
        <BounceBack f={checkin.fields} />
      )}
    </Screen>
  );
}
