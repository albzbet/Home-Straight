import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BounceBack, CheckinQuestions, useCheckin } from '@/components/Checkin';
import { GetHelpButton } from '@/components/GetHelpButton';
import { useCrisisGate } from '@/components/Help';
import { AudioCard, VideoCard } from '@/components/SessionMedia';
import { Button, Card, Choice, Field, PrimaryButton, ProgressBar, Screen, Txt } from '@/components/ui';
import { useContent } from '@/lib/content';
import { highlightTail } from '@/lib/format';
import { photos } from '@/lib/images';
import { FREE_DAYS, localDate, today } from '@/lib/program';
import { lastCheckinDate } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// One daily session (mockup screen 3). The lesson page has the 60-second video and the guided audio, then "Mark as
// complete" leads to the 1-minute check-in and one action for today. Busy day (5 min): the short audio and the check-in.
// Someone who says they gambled gets the bounce-back step straight after the check-in, never a telling-off.
// A session already done opens in "listen again" mode (?review=1): just the lesson, nothing saved. After the program,
// "repeat a week" (?repeat=1) runs done sessions again in full, saving the check-in as a daily check-in instead.
type Step = 'lesson' | 'checkin' | 'bounce' | 'action' | 'done';
const FULL: Step[] = ['lesson', 'checkin', 'action', 'done'];
const BUSY: Step[] = ['lesson', 'checkin', 'done'];
const REVIEW: Step[] = ['lesson', 'done'];

export default function Session() {
  const {
    day: dayParam,
    review: reviewParam,
    repeat: repeatParam,
  } = useLocalSearchParams<{ day: string; review?: string; repeat?: string }>();
  const day = Number(dayParam);
  const th = useTheme();
  const { lesson: findLesson } = useContent();
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
    step === 'lesson' ? (
      review ? (
        <PrimaryButton label="Done" onPress={() => router.back()} />
      ) : (
        <PrimaryButton label="Mark as complete" onPress={() => setAt(1)} />
      )
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

  const [plain, lit] = highlightTail(lesson.title);
  const close = () => (review || repeat ? router.back() : router.replace('/home'));
  const label = (text: string) => <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: th.text }}>{text}</Text>;

  return (
    <Screen footer={footer} help={false} sos={false}>
      {sheet}
      {/* Close on the left, Week and Day in the middle, Urge SOS and Get help now on the right. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={10}>
          <Ionicons name="close" size={26} color={th.text} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: th.text }}>
          Week {lesson.week} • Day {day}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Urge SOS"
          onPress={() => router.push('/sos')}
          hitSlop={8}
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: th.card,
          }}
        >
          <Ionicons name="pulse" size={17} color={th.sos} />
        </Pressable>
        <GetHelpButton />
      </View>
      {step !== 'lesson' && step !== 'done' ? <ProgressBar at={at} of={steps.length - 1} /> : null}

      {step === 'lesson' && (
        <>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 52, color: th.text, marginTop: space.sm }}
          >
            {plain.toUpperCase()}
            <Text style={{ color: th.primary }}>{lit.toUpperCase()}</Text>
          </Text>
          {!review ? (
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: busy }}
              onPress={() => setBusy((b) => !b)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start' }}
            >
              <Ionicons name={busy ? 'checkmark-circle' : 'time-outline'} size={18} color={th.primary} />
              <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: th.primary }}>
                {busy ? 'Busy-day version on (5 minutes)' : 'Busy day? Switch to the 5-minute version'}
              </Text>
            </Pressable>
          ) : null}
          {!busy ? (
            <>
              {label('60 second video')}
              <VideoCard url={lesson.video.url} script={lesson.video.script} poster={photos.session} />
            </>
          ) : null}
          {label(busy ? 'Listen' : 'Follow with audio')}
          {busy ? (
            <AudioCard
              url={lesson.busyAudio.url}
              script={lesson.busyAudio.script}
              title="Short version"
              minutes={lesson.busyAudio.minutes}
            />
          ) : (
            <AudioCard url={lesson.audio.url} script={lesson.audio.script} title={lesson.audio.title} minutes={lesson.audio.minutes} />
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
