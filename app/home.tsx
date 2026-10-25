import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Screen, StepBar, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { lesson } from '@/lib/content';
import { FREE_DAYS, TOTAL_DAYS, today } from '@/lib/program';
import { useStore } from '@/lib/store';
import { space } from '@/lib/theme';

// Home for now: today's session and how far along you are. Step 5 turns this into the 6-week journey path.
export default function Home() {
  const { state, signedIn } = useStore();
  if (!state.onboarding) return <Redirect href="/" />;

  const t = today(state.days);
  const next = t.day ? lesson(t.day) : undefined;
  const prev = t.day ? lesson(t.day - 1) : undefined;
  const needsAccount = !!t.day && t.day > FREE_DAYS && !signedIn;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.lg }}>
        <Txt variant="title">{state.nickname ? `G'day, ${state.nickname}` : "G'day"}</Txt>
        <Button label="Settings" kind="ghost" onPress={() => router.push('/settings')} />
      </View>

      <Card>
        <Txt variant="label">Today</Txt>
        {!t.day || !next ? (
          <Txt variant="h2">You've finished all 42 sessions. That's a big deal.</Txt>
        ) : needsAccount ? (
          <>
            <Txt variant="h2">
              Day {t.day}: {next.title}
            </Txt>
            <Txt variant="muted">Make a free account to save your progress and carry on.</Txt>
            <Button label="Save my progress" onPress={() => router.push('/save-progress')} />
          </>
        ) : t.unlocked ? (
          <>
            <Txt variant="h2">
              Day {t.day}: {next.title}
            </Txt>
            <Txt variant="muted">About 10 minutes, or 5 on a busy day.</Txt>
            <Button label={`Start Day ${t.day}`} onPress={() => router.push(`/session/${t.day}`)} />
          </>
        ) : (
          <>
            <Txt variant="h2">That's today done.</Txt>
            <Txt variant="muted">{prev?.teaser ?? `Day ${t.day} opens tomorrow.`}</Txt>
          </>
        )}
      </Card>

      <Card>
        <Txt variant="label">Your program</Txt>
        <StepBar at={state.days.length} of={TOTAL_DAYS} />
        <Txt variant="muted">
          {state.days.length} of {TOTAL_DAYS} sessions done
        </Txt>
        <Button label="See all 6 weeks" kind="secondary" onPress={() => router.push('/program')} />
      </Card>

      <Txt variant="small">{config.help.disclaimer}</Txt>
    </Screen>
  );
}
