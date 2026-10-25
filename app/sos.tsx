import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Share, View } from 'react-native';
import { useCrisisGate } from '@/components/Help';
import { LessonAudio } from '@/components/Media';
import { Button, Card, Chip, Field, Row, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { money } from '@/lib/format';
import { useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { countUsage } from '@/lib/usage';
import { radius, space, useTheme } from '@/lib/theme';
import type { UrgeLog } from '@/lib/types';

// Urge SOS: a 10-minute timer with a breathing guide, their own why and money goal, a buddy and real people one tap
// away, then a quick log of what happened. Opens straight into the timer: no setup when someone's struggling.

const sos = config.sos;
const gho = config.help.services.find((s) => s.id === 'gho')!;
const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export default function Sos() {
  const { state, saveUrge } = useStore();
  const o = state.onboarding;
  const [phase, setPhase] = useState<'ride' | 'log' | 'thanks'>('ride');
  const started = useRef(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [buddyText, setBuddyText] = useState(sos.buddyMessage);

  const [triggers, setTriggers] = useState<string[]>([]);
  const [passed, setPassed] = useState<UrgeLog['passed'] | null>(null);
  const [helped, setHelped] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();

  useEffect(() => countUsage('sos_opened'), []);
  const total = sos.minutes * 60;
  useEffect(() => {
    if (phase !== 'ride') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started.current.getTime()) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);
  const left = Math.max(0, total - elapsed);
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  const save = () =>
    check([note], async () => {
      setSaving(true);
      setProblem(null);
      try {
        await saveUrge({
          at: started.current.toISOString(),
          seconds: Math.min(elapsed, total),
          triggers,
          passed: passed!,
          helped,
          note: note.trim(),
        });
        setPhase('thanks');
      } catch {
        setProblem("That didn't save. Check your internet connection and try again.");
      } finally {
        setSaving(false);
      }
    });

  if (phase === 'thanks')
    return (
      <Screen sos={false} footer={<Button label="Done" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}>
        <Txt variant="title">
          {passed === 'yes'
            ? "That's one urge you rode out."
            : passed === 'easing'
              ? 'Good on you for sticking with it.'
              : 'Thanks for being honest.'}
        </Txt>
        <Txt variant="muted">
          {passed === 'yes'
            ? 'Every one you ride out makes the next one a bit easier. Remember what helped this time.'
            : passed === 'easing'
              ? 'If it comes back, open Urge SOS again. You can do this as many times as you need.'
              : "A slip doesn't wipe out your progress. Tomorrow's check-in will help you look at what happened, and if you'd like to talk to someone now, they're there for exactly this."}
        </Txt>
        {passed === 'gambled' ? <Button label="Get help now" kind="help" onPress={() => router.push('/help')} /> : null}
      </Screen>
    );

  if (phase === 'log')
    return (
      <Screen
        sos={false}
        footer={
          <>
            {problem ? <Txt variant="small">{problem}</Txt> : null}
            <Button label="Save" onPress={save} disabled={!passed} loading={saving} />
            <Button label="Back to the timer" kind="ghost" onPress={() => setPhase('ride')} />
          </>
        }
      >
        {sheet}
        <Txt variant="title">How did it go?</Txt>
        <Txt variant="h2">Did the urge pass?</Txt>
        <Row>
          <Chip label="Yes, it passed" selected={passed === 'yes'} onPress={() => setPassed('yes')} />
          <Chip label="It's easing" selected={passed === 'easing'} onPress={() => setPassed('easing')} />
          <Chip label="No, I gambled" selected={passed === 'gambled'} onPress={() => setPassed('gambled')} />
        </Row>
        <Txt variant="h2">What set it off?</Txt>
        <Row>
          {sos.triggers.map((x) => (
            <Chip key={x} label={x} selected={triggers.includes(x)} onPress={() => setTriggers(toggle(triggers, x))} />
          ))}
        </Row>
        <Txt variant="h2">What helped?</Txt>
        <Row>
          {sos.helped.map((x) => (
            <Chip key={x} label={x} selected={helped.includes(x)} onPress={() => setHelped(toggle(helped, x))} />
          ))}
        </Row>
        <Field label="Anything else? (optional)" value={note} onChangeText={setNote} multiline maxLength={300} />
      </Screen>
    );

  const why = [...(o?.whyChoices ?? []), o?.whyText].filter(Boolean).join(' · ');
  return (
    <Screen
      sos={false}
      footer={
        <>
          <Button label={left === 0 ? 'I made it. Log how it went' : 'The urge has passed'} onPress={() => setPhase('log')} />
          <Button label="Close" kind="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </>
      }
    >
      <Txt variant="title">You've got this</Txt>
      <Txt variant="muted">{sos.intro}</Txt>

      <Breather elapsed={elapsed} />
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Txt variant="title" style={{ fontVariant: ['tabular-nums'] }}>
          {clock}
        </Txt>
        <Txt variant="small">{left === 0 ? `${sos.minutes} minutes done. Well ridden.` : 'Stay with it until the timer runs out'}</Txt>
      </View>
      {sos.breathingAudioUrl ? <LessonAudio url={sos.breathingAudioUrl} script="" title="Guided breathing" /> : null}

      {why ? (
        <Card>
          <Txt variant="label">Your why</Txt>
          <Txt variant="h2">{why}</Txt>
        </Card>
      ) : null}
      {o?.savingFor || o?.savingTarget ? (
        <Card>
          <Txt variant="label">What you're saving for</Txt>
          <Txt variant="h2">
            {o.savingFor || 'Your goal'}
            {o.savingTarget ? ` · ${money(o.savingTarget)}` : ''}
          </Txt>
          <Txt variant="muted">Every urge you ride out keeps that money where it belongs.</Txt>
        </Card>
      ) : null}

      <Card>
        <Txt variant="label">Reach out</Txt>
        {buddyOpen ? (
          <>
            <Field value={buddyText} onChangeText={setBuddyText} multiline maxLength={300} />
            <Button label="Send" onPress={() => Share.share({ message: buddyText }).catch(() => {})} />
          </>
        ) : (
          <Button
            label={o?.buddyEmail ? 'Message my buddy' : 'Message someone I trust'}
            kind="secondary"
            onPress={() => setBuddyOpen(true)}
          />
        )}
        <Txt variant="h2">Talk to someone now</Txt>
        <Txt variant="muted">
          {gho.name}: {gho.phone}, free and 24/7.
        </Txt>
        <Button label={`Call ${gho.phone}`} onPress={() => Linking.openURL(`tel:${gho.phone.replace(/\s/g, '')}`).catch(() => {})} />
        <Button label="Live chat on their website" kind="secondary" onPress={() => Linking.openURL(gho.web!).catch(() => {})} />
      </Card>
    </Screen>
  );
}

// A circle that grows as you breathe in and shrinks as you breathe out. With reduce motion on, it stays still and the
// words do the guiding.
function Breather({ elapsed }: { elapsed: number }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const { inSeconds, outSeconds } = sos.breathing;
  const breathingIn = elapsed % (inSeconds + outSeconds) < inSeconds;
  const [scale] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    if (reduced) return;
    Animated.timing(scale, {
      toValue: breathingIn ? 1 : 0.6,
      duration: (breathingIn ? inSeconds : outSeconds) * 1000,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [breathingIn, reduced, scale, inSeconds, outSeconds]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 220 }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: radius.pill,
          backgroundColor: t.soft,
          borderWidth: 2,
          borderColor: t.action,
          transform: [{ scale: reduced ? 0.85 : scale }],
        }}
      />
      <Txt variant="h2" style={{ color: t.action }}>
        {breathingIn ? 'Breathe in…' : 'Breathe out…'}
      </Txt>
    </View>
  );
}
