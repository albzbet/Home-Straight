import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { Journey } from '@/components/Journey';
import { Button, Card, Screen, StepBar, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { lesson } from '@/lib/content';
import { money } from '@/lib/format';
import { FREE_DAYS, today } from '@/lib/program';
import { progress } from '@/lib/progress';
import { isPaused } from '@/lib/reminderPlan';
import { remindersSupported, useRemindersOn } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { space, useTheme } from '@/lib/theme';

// Home: today's session, the 6-week journey, gamble-free days and money kept.
export default function Home() {
  const th = useTheme();
  const { state, signedIn, setPause } = useStore();
  const [remindOn, setRemindOn] = useRemindersOn();
  if (!state.onboarding) return <Redirect href="/" />;

  const t = today(state.days);
  const next = t.day ? lesson(t.day) : undefined;
  const prev = t.day ? lesson(t.day - 1) : undefined;
  const needsAccount = !!t.day && t.day > FREE_DAYS && !signedIn;
  const p = progress(state);
  const o = state.onboarding;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt variant="title">{state.nickname ? `G'day, ${state.nickname}` : "G'day"}</Txt>
        <Button label="Settings" kind="ghost" onPress={() => router.push('/settings')} />
      </View>

      {isPaused(state) ? (
        <Card>
          <Txt variant="label">On a break</Txt>
          <Txt variant="h2">Your program is paused</Txt>
          <Txt variant="muted">Everything is waiting right where you left it. Come back whenever you're ready.</Txt>
          <Button label="Pick up where I left off" onPress={() => setPause(false).catch(() => {})} />
        </Card>
      ) : null}

      {remindersSupported && remindOn === false && !isPaused(state) && state.days.length > 0 ? (
        <Card>
          <Txt variant="h2">Want a nudge each morning?</Txt>
          <Txt variant="muted">A quiet reminder at the time you picked. It never mentions gambling.</Txt>
          <Button label="Turn on reminders" kind="secondary" onPress={() => setRemindOn(true)} />
        </Card>
      ) : null}

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

      <Journey days={state.days} currentDay={t.day} />
      <Button label="See all 6 weeks" kind="secondary" onPress={() => router.push('/program')} />

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Card style={{ flex: 1 }}>
          <Txt variant="title">{String(p.gambleFreeDays)}</Txt>
          <Txt variant="muted">gamble-free days in total</Txt>
        </Card>
        <Card style={{ flex: 1 }}>
          <Txt variant="title">{String(p.streak)}</Txt>
          <Txt variant="muted">days in a row</Txt>
        </Card>
      </View>
      {p.gambleFreeDays < p.daysSinceStart ? (
        <Txt variant="small">A slip only restarts the "in a row" count. Every gamble-free day still counts towards your total.</Txt>
      ) : null}

      {o.weeklySpend ? (
        <Card>
          <Txt variant="label">Money kept</Txt>
          <Txt variant="title" style={{ color: th.action }}>
            {money(p.moneyKept)}
          </Txt>
          {p.goalShare !== null ? (
            <>
              <StepBar at={Math.round(p.goalShare * 100)} of={100} />
              <Txt variant="muted">
                {Math.round(p.goalShare * 100)}% of the way to {o.savingFor || 'your goal'} ({money(o.savingTarget!)})
              </Txt>
            </>
          ) : null}
          <Txt variant="small">An estimate, from your usual weekly spend and your gamble-free days.</Txt>
        </Card>
      ) : null}

      <Txt variant="small">{config.help.disclaimer}</Txt>
    </Screen>
  );
}
