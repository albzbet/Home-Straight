import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCrisisGate } from '@/components/Help';
import { LessonAudio, LessonVideo } from '@/components/Media';
import { BounceBack, CheckinQuestions, useCheckin } from '@/components/Checkin';
import { Button, Card, Choice, Field, Screen, StepBar, Txt } from '@/components/ui';
import { weeks, lesson as findLesson } from '@/lib/content';
import { FREE_DAYS, localDate, today } from '@/lib/program';
import { lastCheckinDate } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { space } from '@/lib/theme';

// One daily session. Full (~10 min): video, audio, check-in, one action. Busy day (5 min): audio and check-in.
// Someone who says they gambled gets the bounce-back step straight after the check-in, never a telling-off.
// A session already done opens in "listen again" mode (?review=1): just the lesson, nothing saved. After the program,
// "repeat a week" (?repeat=1) runs done sessions again in full, saving the check-in as a daily check-in instead.
type Step = 'start' | 'video' | 'audio' | 'checkin' | 'bounce' | 'action' | 'done';
const FULL: Step[] = ['start', 'video', 'audio', 'checkin', 'action', 'done'];
const BUSY: Step[] = ['start', 'audio', 'checkin', 'done'];
const REVIEW: Step[] = ['start', 'video', 'audio', 'done'];

export default function Session() {
  const {
    day: dayParam,
    review: reviewParam,
    repeat: repeatParam,
  } = useLocalSearchParams<{ day: string; review?: string; repeat?: string }>();
  const day = Number(dayParam);
  const lesson = findLesson(day);
  const { state, signedIn, saveDay, saveCheckin } = useStore();
  const [busy, setBusy] = useState(false);
  const [at, setAt] = useState(0);
  const checkin = useCheckin();
  const gambled = checkin.gambled;
  const [action, setAction] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const { check, sheet } = useCrisisGate();
  const already = state.days.some((d) => d.day === day);
  const review = already && reviewParam === '1';
  const repeat = already && repeatParam === '1';
  const base = review ? REVIEW : busy ? BUSY : FULL;
  const steps = gambled ? base.flatMap((s) => (s === 'checkin' ? (['checkin', 'bounce'] as Step[]) : [s])) : base;
  const step = steps[at]!;
  const lastDate = lastCheckinDate(state);
  // Only today's session (or one already done, to look back on) can be opened. Day 2 onwards needs an account.
  const t = today(state.days);
  if (!lesson) return <Redirect href="/home" />;
  if (!review && !repeat && step !== 'done' && !already && (t.day !== day || !t.unlocked)) return <Redirect href="/home" />;
  if (step !== 'done' && !already && day > FREE_DAYS && !signedIn) return <Redirect href="/save-progress" />;

  const week = weeks.find((w) => w.week === lesson.week)!;
  const canGo = step !== 'checkin' || checkin.complete;

  const finish = async () => {
    setSaving(true);
    setProblem(null);
    try {
      const answers = { ...checkin.result(), action: action.trim() };
      if (repeat) await saveCheckin({ localDate: localDate(), ...answers });
      else await saveDay({ day, localDate: localDate(), completedAt: new Date().toISOString(), busy, ...answers });
      setAt(at + 1);
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // Their plan for today is checked for crisis words before it's saved.
  const next = () => check([action, ...checkin.texts], () => (steps[at + 1] === 'done' && !review ? finish() : setAt(at + 1)));

  const footer =
    step === 'start' && review ? (
      <>
        <Button label="Listen again" onPress={() => setAt(1)} />
        <Button label="Back" kind="ghost" onPress={() => router.back()} />
      </>
    ) : step === 'done' && review ? (
      <Button label="Done" onPress={() => router.back()} />
    ) : step === 'start' ? (
      <>
        <Button label={`Start (about 10 minutes)`} onPress={() => (setBusy(false), setAt(1))} />
        <Button label="Busy day? Do the 5-minute version" kind="secondary" onPress={() => (setBusy(true), setAt(1))} />
        <Button label="Not now" kind="ghost" onPress={() => router.replace('/home')} />
      </>
    ) : step === 'done' && repeat ? (
      day % 7 !== 0 ? (
        <>
          <Button label={`Next: Day ${day + 1}`} onPress={() => router.replace(`/session/${day + 1}?repeat=1`)} />
          <Button label="That's enough for today" kind="ghost" onPress={() => router.replace('/home')} />
        </>
      ) : (
        <Button label="Back home" onPress={() => router.replace('/home')} />
      )
    ) : step === 'done' ? (
      signedIn ? (
        day % 7 === 0 ? (
          <Button label={`See your week ${day / 7} summary`} onPress={() => router.replace(`/week/${day / 7}`)} />
        ) : (
          <Button label="Done for today" onPress={() => router.replace('/home')} />
        )
      ) : (
        <>
          <Button label="Save my progress" onPress={() => router.replace('/save-progress')} />
          <Button label="Maybe later" kind="ghost" onPress={() => router.replace('/home')} />
        </>
      )
    ) : (
      <>
        {problem ? <Txt variant="small">{problem}</Txt> : null}
        <Button label={steps[at + 1] === 'done' ? 'Finish' : 'Next'} onPress={next} disabled={!canGo} loading={saving} />
        <Button label="Back" kind="ghost" onPress={() => setAt(at - 1)} />
      </>
    );

  return (
    <Screen footer={footer}>
      {sheet}
      {step !== 'start' && step !== 'done' ? <StepBar at={at} of={steps.length - 2} /> : null}

      {step === 'start' && (
        <View style={{ gap: space.md, marginTop: space.xl }}>
          <Txt variant="label">
            Week {lesson.week} · {week.theme} · Day {day}
          </Txt>
          <Txt variant="title">{lesson.title}</Txt>
          <Txt variant="muted">{week.summary}</Txt>
        </View>
      )}

      {step === 'video' && (
        <>
          <Txt variant="h2">{lesson.title}</Txt>
          <LessonVideo url={lesson.video.url} script={lesson.video.script} />
        </>
      )}

      {step === 'audio' && (
        <>
          <Txt variant="h2">{lesson.audio.title}</Txt>
          <Txt variant="muted">
            {busy ? `${lesson.busyAudio.minutes} minutes` : `${lesson.audio.minutes} minutes`}. Find a comfy spot. Headphones help.
          </Txt>
          {busy ? (
            <LessonAudio url={lesson.busyAudio.url} script={lesson.busyAudio.script} />
          ) : (
            <LessonAudio url={lesson.audio.url} script={lesson.audio.script} />
          )}
        </>
      )}

      {step === 'checkin' && <CheckinQuestions f={checkin.fields} lastDate={lastDate} />}

      {step === 'bounce' && <BounceBack f={checkin.fields} />}

      {step === 'action' && (
        <>
          <Txt variant="title">One thing for today</Txt>
          <Txt variant="muted">{lesson.action.prompt}</Txt>
          {lesson.action.options.map((opt) => (
            <Choice key={opt} label={opt} selected={action === opt} onPress={() => setAction(action === opt ? '' : opt)} />
          ))}
          <Field
            label="Or write your own plan"
            placeholder="If I get an urge at 3pm, I'll..."
            value={lesson.action.options.includes(action) ? '' : action}
            onChangeText={setAction}
            multiline
            maxLength={300}
          />
        </>
      )}

      {step === 'done' && (
        <View style={{ gap: space.lg, marginTop: space.xl }}>
          <Txt variant="title">{review || repeat ? `That's Day ${day} again.` : `Day ${day} done. Good on you.`}</Txt>
          {gambled ? <Txt>Bouncing back is what counts, and you just did it.</Txt> : null}
          {action.trim() ? (
            <Card>
              <Txt variant="label">Your one thing for today</Txt>
              <Txt>{action.trim()}</Txt>
            </Card>
          ) : null}
          {!review && !repeat ? <Txt variant="muted">{lesson.teaser}</Txt> : null}
          {!signedIn && !review && !repeat ? (
            <Card>
              <Txt variant="h2">Keep going tomorrow</Txt>
              <Txt variant="muted">
                Make a free account to save what you've done and unlock the rest of Week 1. Just a nickname, never your real name.
              </Txt>
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
