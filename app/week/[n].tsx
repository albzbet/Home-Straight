import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { Stat } from '@/components/Stat';
import { Button, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { weeks } from '@/lib/content';
import { money } from '@/lib/format';
import { useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { weekSummary } from '@/lib/summary';
import { radius, space, useTheme } from '@/lib/theme';

// End of a week: a quiet well done, what the week added up to, and what's coming next. No confetti, no prizes.
export default function WeekDone() {
  const t = useTheme();
  const reduced = useReducedMotion();
  const { n } = useLocalSearchParams<{ n: string }>();
  const week = Number(n);
  const { state } = useStore();
  const [grow] = useState(() => new Animated.Value(reduced ? 1 : 0.6));
  useEffect(() => {
    if (!reduced) Animated.spring(grow, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [grow, reduced]);

  const theme = weeks.find((w) => w.week === week);
  if (!theme) return <Redirect href="/home" />;
  const s = weekSummary(state, week);
  const nextWeek = weeks.find((w) => w.week === week + 1);
  const mood = s.averageMood ? config.checkin.moods[Math.round(s.averageMood) - 1] : null;

  return (
    <Screen
      footer={
        <Button
          label={week === 6 ? 'See how far you’ve come' : 'Back home'}
          onPress={() => router.replace(week === 6 ? '/finish' : '/home')}
        />
      }
    >
      <View style={{ alignItems: 'center', gap: space.md, marginTop: space.lg }}>
        <Animated.View
          style={{
            width: 96,
            height: 96,
            borderRadius: radius.pill,
            backgroundColor: t.action,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: grow }],
          }}
        >
          <Txt variant="title" style={{ color: t.actionInk, fontSize: 44, lineHeight: 52 }}>
            ✓
          </Txt>
        </Animated.View>
        <Txt variant="label">
          Week {week} · {theme.theme}
        </Txt>
        <Txt variant="title" style={{ textAlign: 'center' }}>
          Week {week} done. That's real progress.
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Stat value={`${s.sessions} of 7`} label="sessions done" />
        <Stat value={String(s.urgesHandled)} label={s.urgesHandled === 1 ? 'urge ridden out' : 'urges ridden out'} />
        <Stat value={String(s.gambleFreeDays)} label="gamble-free days" />
        {state.onboarding?.weeklySpend ? <Stat value={money(s.moneyKept)} label="money kept (estimate)" /> : null}
      </View>
      {mood ? <Txt variant="muted">On average you felt "{mood.toLowerCase()}" this week.</Txt> : null}
      {nextWeek ? (
        <Txt variant="muted">
          Coming up in Week {nextWeek.week}: {nextWeek.theme}. {nextWeek.summary}
        </Txt>
      ) : null}
    </Screen>
  );
}
