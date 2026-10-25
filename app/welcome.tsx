import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Choice, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { useStore } from '@/lib/store';
import { accountsAvailable } from '@/lib/supabase';
import { space } from '@/lib/theme';

// First screen: what this is, 18+ check, and "try Day 1 first" (no account needed).
export default function Welcome() {
  const { confirmAdult } = useStore();
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      await confirmAdult();
      router.replace('/onboarding');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <Button label="Try Day 1, no account needed" onPress={start} disabled={!adult} loading={busy} />
          {accountsAvailable ? <Button label="I already have an account" kind="ghost" onPress={() => router.push('/sign-in')} /> : null}
        </>
      }
    >
      <View style={{ gap: space.md, marginTop: space.xxl }}>
        <Txt variant="title">G'day. Let's get you back in control.</Txt>
        <Txt variant="muted">
          A 6-week morning program, about 10 minutes a day, to help you quit, cut back or take a break from gambling. At your pace, no
          judgement.
        </Txt>
      </View>
      <View style={{ gap: space.sm }}>
        <Txt>• A short lesson each morning</Txt>
        <Txt>• A quick check-in on how you're going</Txt>
        <Txt>• One small thing to try that day</Txt>
        <Txt>• Help on hand whenever an urge hits</Txt>
      </View>
      <Txt variant="small">{config.help.disclaimer} It works alongside Gambling Help Online (1800 858 858, free, 24/7).</Txt>
      <Choice label="I'm 18 or older" selected={adult} onPress={() => setAdult((a) => !a)} />
    </Screen>
  );
}
