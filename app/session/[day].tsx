import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCrisisGate } from '@/components/Help';
import { LessonAudio, LessonVideo } from '@/components/Media';
import { Button, Card, Chip, Choice, Field, Row, Screen, StepBar, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { weeks, lesson as findLesson } from '@/lib/content';
import { parseMoney } from '@/lib/format';
import { FREE_DAYS, localDate, today } from '@/lib/program';
import { useStore } from '@/lib/store';
import { space } from '@/lib/theme';

// One daily session. Full (~10 min): video, audio, check-in, one action. Busy day (5 min): audio and check-in.
// Someone who says they gambled gets the bounce-back step straight after the check-in, never a telling-off.
// A session already done opens in "listen again" mode (?review=1): just the lesson, nothing saved.
type Step = 'start' | 'video' | 'audio' | 'checkin' | 'bounce' | 'action' | 'done';
const FULL: Step[] = ['start', 'video', 'audio', 'checkin', 'action', 'done'];
const BUSY: Step[] = ['start', 'audio', 'checkin', 'done'];
const REVIEW: Step[] = ['start', 'video', 'audio', 'done'];

export default function Session() {
  const { day: dayParam, review: reviewParam } = useLocalSearchParams<{ day: string; review?: string }>();
  const day = Number(dayParam);
  const lesson = findLesson(day);
  const { state, signedIn, saveDay } = useStore();
  const [busy, setBusy] = useState(false);
  const [at, setAt] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [urge, setUrge] = useState<number | null>(null);
  const [gambled, setGambled] = useState<boolean | null>(null);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState('');
  const [slipWhat, setSlipWhat] = useState<string[]>([]);
  const [slipNote, setSlipNote] = useState('');
  const [slipDifferent, setSlipDifferent] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const { check, sheet } = useCrisisGate();
  const already = state.days.some((d) => d.day === day);
  const review = already && reviewParam === '1';
  const base = review ? REVIEW : busy ? BUSY : FULL;
  const steps = gambled ? base.flatMap((s) => (s === 'checkin' ? (['checkin', 'bounce'] as Step[]) : [s])) : base;
  const step = steps[at]!;
  const lastCheckin = state.days.filter((d) => d.day !== day).at(-1);
  // Only today's session (or one already done, to look back on) can be opened. Day 2 onwards needs an account.
  const t = today(state.days);
  if (!lesson) return <Redirect href="/home" />;
  if (!review && step !== 'done' && !already && (t.day !== day || !t.unlocked)) return <Redirect href="/home" />;
  if (step !== 'done' && !already && day > FREE_DAYS && !signedIn) return <Redirect href="/save-progress" />;

  const week = weeks.find((w) => w.week === lesson.week)!;
  const canGo = step !== 'checkin' || (mood !== null && urge !== null && gambled !== null);

  const finish = async () => {
    setSaving(true);
    setProblem(null);
    try {
      await saveDay({
        day,
        localDate: localDate(),
        completedAt: new Date().toISOString(),
        busy,
        mood,
        urge,
        gambled,
        amount: gambled ? parseMoney(amount) : null,
        action: action.trim(),
        slipWhat: gambled ? [...slipWhat, slipNote.trim()].filter(Boolean).join('; ') : '',
        slipDifferent: gambled ? slipDifferent.trim() : '',
      });
      setAt(at + 1);
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // Their plan for today is checked for crisis words before it's saved.
  const next = () => check([action, slipNote, slipDifferent], () => (steps[at + 1] === 'done' && !review ? finish() : setAt(at + 1)));

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
    ) : step === 'done' ? (
      signedIn ? (
        <Button label="Done for today" onPress={() => router.replace('/home')} />
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

      {step === 'checkin' && (
        <>
          <Txt variant="title">Quick check-in</Txt>
          <Txt variant="h2">How are you feeling?</Txt>
          <Row>
            {config.checkin.moods.map((m, i) => (
              <Chip key={m} label={m} selected={mood === i + 1} onPress={() => setMood(i + 1)} />
            ))}
          </Row>
          <Txt variant="h2">How strong is the urge to gamble right now?</Txt>
          <Txt variant="small">0 is none at all, 10 is the strongest it gets.</Txt>
          <Row>
            {Array.from({ length: 11 }, (_, n) => (
              <Chip key={n} label={String(n)} selected={urge === n} onPress={() => setUrge(n)} />
            ))}
          </Row>
          <Txt variant="h2">{checkinQuestion(lastCheckin?.localDate)}</Txt>
          <Row>
            <Chip label="No" selected={gambled === false} onPress={() => setGambled(false)} />
            <Chip label="Yes" selected={gambled === true} onPress={() => setGambled(true)} />
          </Row>
          {gambled ? (
            <>
              <Field
                label="How much, roughly? (optional)"
                placeholder="$"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </>
          ) : null}
        </>
      )}

      {step === 'bounce' && (
        <>
          <Txt variant="title">Thanks for being honest</Txt>
          <Txt variant="muted">
            A slip doesn't wipe out your progress. Every gamble-free day you've had still counts, and you're still here, which is what
            matters. Let's look at what happened so next time can go differently.
          </Txt>
          <Txt variant="h2">What was going on?</Txt>
          <Row>
            {SLIP_REASONS.map((r) => (
              <Chip key={r} label={r} selected={slipWhat.includes(r)} onPress={() => setSlipWhat(toggle(slipWhat, r))} />
            ))}
          </Row>
          <Field label="Anything else? (optional)" value={slipNote} onChangeText={setSlipNote} multiline maxLength={300} />
          <Txt variant="h2">What could you do differently next time?</Txt>
          <Field
            placeholder="e.g. Leave my card at home on payday"
            value={slipDifferent}
            onChangeText={setSlipDifferent}
            multiline
            maxLength={300}
          />
        </>
      )}

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
          <Txt variant="title">{review ? `That's Day ${day} again.` : `Day ${day} done. Good on you.`}</Txt>
          {gambled ? <Txt>Bouncing back is what counts, and you just did it.</Txt> : null}
          {action.trim() ? (
            <Card>
              <Txt variant="label">Your one thing for today</Txt>
              <Txt>{action.trim()}</Txt>
            </Card>
          ) : null}
          {!review ? <Txt variant="muted">{lesson.teaser}</Txt> : null}
          {!signedIn && !review ? (
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

const SLIP_REASONS = [
  ...config.onboarding.riskyTimes.map((r) => r.label),
  'An ad or offer',
  'Trying to win back money',
  'Someone else was betting',
  "I'm not sure",
];

const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

// "Did you gamble yesterday?", or "since your last check-in" when they've been away for a few days.
function checkinQuestion(lastDate: string | undefined): string {
  const yesterday = localDate(new Date(Date.now() - 86_400_000));
  return !lastDate || lastDate >= yesterday ? 'Did you gamble yesterday?' : 'Have you gambled since your last check-in?';
}
