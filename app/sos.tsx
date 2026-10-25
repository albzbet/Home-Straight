import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Pressable, Share, Text, View } from 'react-native';
import { useCrisisGate } from '@/components/Help';
import { LessonAudio } from '@/components/Media';
import { Button, Card, Chip, Field, PrimaryButton, Row, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { money } from '@/lib/format';
import { useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { countUsage } from '@/lib/usage';
import { fonts, radius, space, useTheme } from '@/lib/theme';
import type { UrgeLog } from '@/lib/types';

// Urge SOS (mockup screen 4): a breathing circle with a 1, 3 or 5 minute timer, three tools (Breathe, Ground, Reframe, with
// their own why and money goal), a buddy and real people one tap away, then a quick log of what happened. Opens straight
// into breathing: no setup when someone's struggling.

const sos = config.sos;
const gho = config.help.services.find((s) => s.id === 'gho')!;
const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export default function Sos() {
  const th = useTheme();
  const { state, saveUrge } = useStore();
  const o = state.onboarding;
  const [phase, setPhase] = useState<'ride' | 'log' | 'thanks'>('ride');
  const started = useRef(new Date()); // when they opened it (for the log)
  const [minutes, setMinutes] = useState<number>(sos.durations[0]!);
  const [timerStart, setTimerStart] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [tool, setTool] = useState<'breathe' | 'ground' | 'reframe'>('breathe');
  const [talkOpen, setTalkOpen] = useState(false);
  const [grounded, setGrounded] = useState<number[]>([]);
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
  const total = minutes * 60;
  useEffect(() => {
    if (phase !== 'ride') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - timerStart) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase, timerStart]);
  const restart = (m: number) => {
    setMinutes(m);
    setTimerStart(Date.now());
    setElapsed(0);
  };
  const left = Math.max(0, total - elapsed);

  const save = () =>
    check([note], async () => {
      setSaving(true);
      setProblem(null);
      try {
        await saveUrge({
          at: started.current.toISOString(),
          seconds: Math.round((Date.now() - started.current.getTime()) / 1000),
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
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const tools = [
    { id: 'breathe' as const, label: 'Breathe', sub: 'Reset fast', icon: 'leaf' as const, color: th.success },
    { id: 'ground' as const, label: 'Ground', sub: 'Be present', icon: 'body' as const, color: th.calm },
    { id: 'reframe' as const, label: 'Reframe', sub: 'Shift your thinking', icon: 'heart-half' as const, color: th.explore },
  ];
  return (
    <Screen
      sos={false}
      footer={
        <>
          <PrimaryButton label={left === 0 ? 'I made it. Log how it went' : 'The urge has passed'} onPress={() => setPhase('log')} />
          <Button label="Close" kind="ghost" onPress={close} />
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 58, color: th.text }}>
          URGE <Text style={{ color: th.primary }}>SOS</Text>
        </Text>
        <Txt variant="muted">{sos.tagline}</Txt>
      </View>

      <Breather elapsed={elapsed} left={left} onAgain={() => restart(minutes)} />

      {/* 1, 3 or 5 minutes. */}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {sos.durations.map((m) => (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ selected: minutes === m }}
            onPress={() => restart(m)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 10,
              borderRadius: radius.pill,
              backgroundColor: minutes === m ? th.text : th.card,
              borderWidth: 1,
              borderColor: th.cardBorder,
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: minutes === m ? th.bg : th.textMuted }}>{m} min</Text>
          </Pressable>
        ))}
      </View>
      {sos.breathingAudioUrl ? <LessonAudio url={sos.breathingAudioUrl} script="" title="Guided breathing" /> : null}

      {/* Breathe / Ground / Reframe. */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {tools.map((x) => (
          <Pressable
            key={x.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tool === x.id }}
            onPress={() => setTool(x.id)}
            style={{ alignItems: 'center', gap: 4, width: 104, opacity: tool === x.id ? 1 : 0.7 }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: th.card,
                borderWidth: 2,
                borderColor: tool === x.id ? x.color : th.cardBorder,
              }}
            >
              <Ionicons name={x.icon} size={24} color={x.color} />
            </View>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: th.text }}>{x.label}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: th.textMuted }}>{x.sub}</Text>
          </Pressable>
        ))}
      </View>

      {tool === 'breathe' ? (
        <Card>
          <Txt variant="muted">{sos.intro}</Txt>
        </Card>
      ) : null}

      {tool === 'ground' ? (
        <Card>
          <Txt variant="h2">Come back to right now</Txt>
          <Txt variant="muted">Look around you and name, out loud or in your head. Tap each one as you go.</Txt>
          {sos.ground.map((g, i) => (
            <Pressable
              key={g}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: grounded.includes(i) }}
              onPress={() => setGrounded(grounded.includes(i) ? grounded.filter((x) => x !== i) : [...grounded, i])}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 }}
            >
              <Ionicons name={grounded.includes(i) ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={th.calm} />
              <Text style={{ fontFamily: fonts.medium, fontSize: 16, color: th.text }}>{g}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {tool === 'reframe' ? (
        <>
          {sos.reframes.map((r) => (
            <Card key={r.thought}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: th.textMuted }}>{r.thought}</Text>
              <Txt>{r.reply}</Txt>
            </Card>
          ))}
          {why ? (
            <Card raised>
              <Txt variant="label">Your why</Txt>
              <Txt variant="h2">{why}</Txt>
            </Card>
          ) : null}
          {o?.savingFor || o?.savingTarget ? (
            <Card raised>
              <Txt variant="label">What you're saving for</Txt>
              <Txt variant="h2">
                {o.savingFor || 'Your goal'}
                {o.savingTarget ? ` · ${money(o.savingTarget)}` : ''}
              </Txt>
              <Txt variant="muted">Every urge you ride out keeps that money where it belongs.</Txt>
            </Card>
          ) : null}
        </>
      ) : null}

      {/* Talk to someone. */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: talkOpen }}
        onPress={() => setTalkOpen((x) => !x)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          padding: space.lg,
          borderRadius: radius.lg,
          backgroundColor: th.card,
          borderWidth: 1,
          borderColor: th.cardBorder,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: th.success,
          }}
        >
          <Ionicons name="call" size={18} color={th.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: th.text }}>Talk to someone</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: th.textMuted }}>Real support, anytime</Text>
        </View>
        <Ionicons name={talkOpen ? 'chevron-up' : 'chevron-forward'} size={20} color={th.textMuted} />
      </Pressable>
      {talkOpen ? (
        <Card>
          <Txt variant="h2">{gho.name}</Txt>
          <Txt variant="muted">Free and confidential, 24/7. Phone {gho.phone}, or live chat.</Txt>
          <PrimaryButton
            label={`Call ${gho.phone}`}
            icon="call"
            onPress={() => Linking.openURL(`tel:${gho.phone.replace(/\s/g, '')}`).catch(() => {})}
          />
          <Button
            label="Live chat on their website"
            kind="secondary"
            icon="chatbubbles"
            onPress={() => Linking.openURL(gho.web!).catch(() => {})}
          />
          {buddyOpen ? (
            <>
              <Field value={buddyText} onChangeText={setBuddyText} multiline maxLength={300} />
              <Button label="Send" kind="secondary" onPress={() => Share.share({ message: buddyText }).catch(() => {})} />
            </>
          ) : (
            <Button
              label={o?.buddyEmail ? 'Message my buddy' : 'Message someone I trust'}
              kind="ghost"
              onPress={() => setBuddyOpen(true)}
            />
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

// The big breathing circle: a green ring that grows as you breathe in and shrinks as you breathe out, with a countdown for
// each breath. With reduce motion on, it stays still and the words and numbers do the guiding.
function Breather({ elapsed, left, onAgain }: { elapsed: number; left: number; onAgain: () => void }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const { inSeconds, outSeconds } = sos.breathing;
  const pos = elapsed % (inSeconds + outSeconds);
  const breathingIn = pos < inSeconds;
  const count = breathingIn ? inSeconds - pos : inSeconds + outSeconds - pos;
  const [scale] = useState(() => new Animated.Value(0.82));
  const done = left === 0;

  useEffect(() => {
    if (reduced || done) return;
    Animated.timing(scale, {
      toValue: breathingIn ? 1 : 0.82,
      duration: (breathingIn ? inSeconds : outSeconds) * 1000,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [breathingIn, reduced, done, scale, inSeconds, outSeconds]);

  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 260 }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: 120,
          borderWidth: 10,
          borderColor: t.success,
          backgroundColor: t.successSoft,
          shadowColor: t.success,
          shadowOpacity: 0.6,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ scale: reduced || done ? 0.92 : scale }],
        }}
      />
      {done ? (
        <Pressable accessibilityRole="button" onPress={onAgain} style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: t.text }}>Well ridden</Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: t.success }}>Tap to go again</Text>
        </Pressable>
      ) : (
        <View style={{ alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: t.text }}>{breathingIn ? 'Breathe in' : 'Breathe out'}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 68, color: t.text }}>{String(count)}</Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t.textMuted }}>{time} left</Text>
        </View>
      )}
    </View>
  );
}
