import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AdminScreen } from '@/components/Admin';
import { Stat } from '@/components/Stat';
import { Button, Card, StepBar, Txt } from '@/components/ui';
import { fetchStats, type Stats } from '@/lib/admin';
import { space } from '@/lib/theme';

// Totals and averages only. Never anyone's own answers; averages need at least 5 people behind them.
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const load = () =>
    fetchStats()
      .then((s) => (setStats(s), setProblem(null)))
      .catch((e: Error) => setProblem(e.message));
  useEffect(() => {
    load();
  }, []);

  if (!stats)
    return (
      <AdminScreen title="Dashboard">
        <Txt variant="muted">{problem ? `Couldn't load the numbers: ${problem}` : 'Loading…'}</Txt>
        {problem ? <Button label="Try again" onPress={load} /> : null}
      </AdminScreen>
    );

  const f = stats.funnel;
  const steps: [string, number][] = [
    ['Day 1', f.day1],
    ['Day 3', f.day3],
    ['Day 7 (end of week 1)', f.day7],
    ['Week 3', f.week3],
    ['Week 8 (finished)', f.week8],
  ];
  const notEnough = `Shown once at least ${stats.minGroup} people are behind it.`;
  return (
    <AdminScreen title="Dashboard" footer={<Button label="Refresh" kind="secondary" onPress={load} />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Stat value={String(stats.members)} label="members with an account" />
        <Stat value={String(stats.tryFirst.day1)} label="tried Day 1 before making an account" />
      </View>

      <Card>
        <Txt variant="label">How far members get</Txt>
        {steps.map(([label, n]) => (
          <View key={label} style={{ gap: space.xs }}>
            <Txt>
              {label}: {n} {stats.members ? `(${Math.round((n / stats.members) * 100)}%)` : ''}
            </Txt>
            <StepBar at={n} of={Math.max(1, stats.members)} />
          </View>
        ))}
      </Card>

      <Card>
        <Txt variant="label">Urge SOS</Txt>
        <Txt>
          Opened {stats.sos.opened} times ({stats.sos.opened30} in the last 30 days).
        </Txt>
        <Txt>
          Logged afterwards {stats.sos.logged} times. The urge passed or eased {stats.sos.handled} times
          {stats.sos.logged ? ` (${Math.round((stats.sos.handled / stats.sos.logged) * 100)}%)` : ''}.
        </Txt>
      </Card>

      <Card>
        <Txt variant="label">Check-ins, last 30 days</Txt>
        {stats.checkins30 ? (
          <Txt>
            {stats.checkins30.count} check-ins. Average mood {stats.checkins30.mood} out of 5, average urge {stats.checkins30.urge} out of
            10.
          </Txt>
        ) : (
          <Txt variant="muted">{notEnough}</Txt>
        )}
      </Card>

      <Card>
        <Txt variant="label">Before and after (questionnaire totals, 0 to 27, lower is better)</Txt>
        {stats.questionnaire.before !== undefined ? (
          <Txt>
            {stats.questionnaire.people} people have done both. Average at the start {stats.questionnaire.before}, at the end{' '}
            {stats.questionnaire.after}.
          </Txt>
        ) : (
          <Txt variant="muted">
            {stats.questionnaire.people} so far. {notEnough}
          </Txt>
        )}
      </Card>
    </AdminScreen>
  );
}
