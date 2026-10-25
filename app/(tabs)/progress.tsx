import { View } from 'react-native';
import { Journey } from '@/components/Journey';
import { Card, Screen, StatCard, Txt } from '@/components/ui';
import { money } from '@/lib/format';
import { today } from '@/lib/program';
import { progress } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { space, useTheme } from '@/lib/theme';

// Progress tab. The full mockup version (this week / month / total, weekly goals) is still to come; for now, the journey and
// the totals.
export default function Progress() {
  const th = useTheme();
  const { state } = useStore();
  const p = progress(state);
  const t = today(state.days);
  return (
    <Screen tab>
      <Txt variant="title">Your progress</Txt>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard icon="flame" value={String(p.streak)} label="Days in a row" />
        <StatCard icon="calendar" iconColor={th.success} value={String(p.gambleFreeDays)} label="Gamble-free days" />
        {state.onboarding?.weeklySpend ? (
          <StatCard icon="cash" iconColor={th.success} value={money(p.moneyKept)} label="Money kept" />
        ) : null}
      </View>
      <Journey days={state.days} currentDay={t.day} />
      <Card>
        <Txt variant="label">Coming soon</Txt>
        <Txt variant="muted">This week, this month and all-time views, and your weekly goals.</Txt>
      </Card>
    </Screen>
  );
}
