import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Kelpie } from '@/components/Brand';
import { useCrisisGate } from '@/components/Help';
import { Button, Card, Choice, Field, PrimaryButton, ProgressBar, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { LOOP_LABELS, LOOP_STEPS, loopChoices, type LoopStep } from '@/lib/loop';
import { useStore } from '@/lib/store';
import { fonts, radius, space, useTheme } from '@/lib/theme';
import type { Loop } from '@/lib/types';

const empty: Loop = { triggers: [], thoughts: [], feelings: [], where: [], payoffs: [], costs: [], helped: '', at: '' };
const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

// Your loop: their own cycle (the CBT "formulation"), built from Day 8 in a few taps: trigger, thought, feeling and urge,
// what they do, what they get out of it, what it costs (which sets up the next trigger). Shown as a loop with a tool to
// break each link. Updated any time; Week 3 adds to the thoughts.
export default function LoopScreen() {
  const t = useTheme();
  const { state, saveLoop } = useStore();
  const [draft, setDraft] = useState<Loop>(state.loop ?? empty);
  // 'view' shows the saved loop; 'intro'; a number is a step in LOOP_STEPS; 'helped' is the last step.
  const [step, setStep] = useState<'view' | 'intro' | number | 'helped'>(state.loop ? 'view' : 'intro');
  const [own, setOwn] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();
  const total = LOOP_STEPS.length + 1;

  const save = () =>
    check([draft.helped], async () => {
      setSaving(true);
      setProblem(null);
      try {
        await saveLoop({ ...draft, helped: draft.helped.trim(), at: new Date().toISOString() });
        setStep('view');
      } catch {
        setProblem("That didn't save. Check your internet connection and try again.");
      } finally {
        setSaving(false);
      }
    });

  if (step === 'view' && state.loop) {
    const loop = state.loop;
    return (
      <Screen footer={<Button label="Update my loop" kind="secondary" icon="create" onPress={() => setStep(0)} />}>
        <Txt variant="title">Your loop</Txt>
        <Txt variant="muted">This is the cycle that keeps gambling going for you. Every link is a place to break it.</Txt>
        {LOOP_STEPS.map((s, i) => {
          const breakIt = config.loop.breakIt[s];
          return (
            <View key={s} style={{ gap: space.sm }}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: radius.pill,
                      backgroundColor: t.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: t.onPrimary }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.5, color: t.text }}>
                    {LOOP_LABELS[s].title.toUpperCase()}
                  </Text>
                </View>
                <Txt style={{ fontFamily: fonts.semibold }}>{loop[s].length ? loop[s].join(' · ') : 'Not filled in yet'}</Txt>
                <View style={{ borderTopWidth: 1, borderTopColor: t.cardBorder, paddingTop: space.sm, gap: space.xs }}>
                  <Txt variant="small">
                    <Text style={{ fontFamily: fonts.semibold, color: t.success }}>Break it here: </Text>
                    {breakIt.text}
                  </Txt>
                  <Button label={breakIt.button} kind="ghost" onPress={() => router.push(breakIt.href as Href)} />
                </View>
              </Card>
              {i < LOOP_STEPS.length - 1 ? (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="arrow-down" size={20} color={t.textMuted} />
                </View>
              ) : null}
            </View>
          );
        })}
        {/* The cost feeds the next round: that's what makes it a loop. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm }}>
          <Ionicons name="refresh" size={22} color={t.primary} />
          <Txt variant="muted" style={{ flex: 1 }}>
            ...and round it goes: the cost (stress, money worries, guilt) sets up the next trigger.
          </Txt>
        </View>
        {loop.helped ? (
          <Card raised>
            <Txt variant="label">What's helped before</Txt>
            <Txt>{loop.helped}</Txt>
            <Txt variant="small">You've done it before. That's a strength to build on.</Txt>
          </Card>
        ) : null}
      </Screen>
    );
  }

  const at = step === 'intro' || step === 'view' ? 0 : step === 'helped' ? total : (step as number) + 1;
  const progress = <ProgressBar at={at} of={total} />;

  if (step === 'intro' || step === 'view')
    return (
      <Screen footer={<PrimaryButton label="Map my loop" onPress={() => setStep(0)} />}>
        <View style={{ alignItems: 'center', paddingTop: space.md }}>
          <Kelpie height={72} />
        </View>
        <Txt variant="title">Your loop</Txt>
        <Txt>{config.loop.intro}</Txt>
        <Txt variant="muted">Pick what fits, and add your own words. Only you can see it.</Txt>
      </Screen>
    );

  if (step === 'helped')
    return (
      <Screen
        footer={
          <>
            {problem ? <Txt variant="small">{problem}</Txt> : null}
            <PrimaryButton label="See my loop" onPress={save} loading={saving} />
            <Button label="Back" kind="ghost" onPress={() => setStep(LOOP_STEPS.length - 1)} />
          </>
        }
      >
        {sheet}
        {progress}
        <Txt variant="label">
          Step {total} of {total} · optional
        </Txt>
        <Txt variant="h2">{config.loop.helped}</Txt>
        <Field
          placeholder="e.g. Leaving my card at home, being busy on weekends"
          value={draft.helped}
          onChangeText={(helped) => setDraft({ ...draft, helped })}
          multiline
          maxLength={500}
        />
      </Screen>
    );

  const s: LoopStep = LOOP_STEPS[step as number]!;
  const { options, yours } = loopChoices(s, state, draft[s]);
  const addOwn = () =>
    check([own], () => {
      if (own.trim()) setDraft({ ...draft, [s]: [...draft[s], own.trim()] });
      setOwn('');
    });
  const i = step as number;
  return (
    <Screen
      footer={
        <>
          <PrimaryButton
            label="Next"
            onPress={() =>
              check([own], () => {
                const next = own.trim() ? { ...draft, [s]: [...draft[s], own.trim()] } : draft;
                setDraft(next);
                setOwn('');
                setStep(i + 1 < LOOP_STEPS.length ? i + 1 : 'helped');
              })
            }
          />
          <Button label="Back" kind="ghost" onPress={() => setStep(i ? i - 1 : state.loop ? 'view' : 'intro')} />
        </>
      }
    >
      {sheet}
      {progress}
      <Txt variant="label">
        Step {i + 1} of {total} · {LOOP_LABELS[s].title}
      </Txt>
      <Txt variant="h2">{LOOP_LABELS[s].question}</Txt>
      <Txt variant="small">Pick any that fit. Skip any step that doesn't.</Txt>
      {options.map((o) => (
        <Choice
          key={o}
          label={o}
          badge={yours.has(o) ? 'Yours' : undefined}
          selected={draft[s].includes(o)}
          onPress={() => setDraft({ ...draft, [s]: toggle(draft[s], o) })}
        />
      ))}
      <Field label="Something else? In your own words" value={own} onChangeText={setOwn} maxLength={120} onSubmitEditing={addOwn} />
      {own.trim() ? <Button label="Add it" kind="secondary" icon="add" onPress={addOwn} /> : null}
    </Screen>
  );
}
