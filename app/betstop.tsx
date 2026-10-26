import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';
import { openBetstop } from '@/components/Betstop';
import { Button, Card, PrimaryButton, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { useStore } from '@/lib/store';
import { space, useTheme } from '@/lib/theme';

// BetStop, the national self-exclusion register, and other ways to make betting harder to get to. Recommended to everyone
// who's chosen to stop completely; open to everyone from More.
export default function Betstop() {
  const t = useTheme();
  const { state, saveOnboarding } = useStore();
  const o = state.onboarding;
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const done = !!o?.betstopAt;

  const mark = async (signedUp: boolean) => {
    if (!o) return;
    setSaving(true);
    setProblem(null);
    try {
      await saveOnboarding({ ...o, betstopAt: signedUp ? new Date().toISOString() : null });
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          <PrimaryButton label="Go to BetStop" icon="open-outline" onPress={openBetstop} />
          {o ? (
            done ? (
              <Button label="Not signed up after all? Take the tick off" kind="ghost" onPress={() => mark(false)} disabled={saving} />
            ) : (
              <Button label="I've signed up" kind="secondary" icon="checkmark" onPress={() => mark(true)} loading={saving} />
            )
          ) : null}
        </>
      }
    >
      <Txt variant="label">Make it harder to slip</Txt>
      <Txt variant="title">BetStop</Txt>
      {done ? (
        <Card style={{ borderColor: t.success, backgroundColor: t.successSoft }}>
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={28} color={t.success} />
            <Txt style={{ flex: 1 }}>
              You're signed up. That's a big step: the betting companies can't take your bets or send you offers.
            </Txt>
          </View>
        </Card>
      ) : null}
      <Txt>{config.betstop.intro}</Txt>
      {o?.goal === 'quit' && !done ? (
        <Txt variant="muted">You've chosen to stop completely, so we recommend it. It takes the decision out of a tough moment.</Txt>
      ) : null}
      <Card>
        <Txt variant="label">How it works</Txt>
        {config.betstop.facts.map((f) => (
          <View key={f} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
            <Ionicons name="checkmark-circle" size={18} color={t.success} style={{ marginTop: 3 }} />
            <Txt style={{ flex: 1 }}>{f}</Txt>
          </View>
        ))}
      </Card>
      <Txt variant="label">More ways to make it harder</Txt>
      {config.betstop.more.map((m) => (
        <Card key={m.title}>
          <Txt variant="h2">{m.title}</Txt>
          <Txt variant="muted">{m.text}</Txt>
        </Card>
      ))}
      <Txt variant="small">BetStop is run by the Australian Communications and Media Authority. homestr8 isn't part of it.</Txt>
    </Screen>
  );
}
