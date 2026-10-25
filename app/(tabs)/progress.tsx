import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Photo } from '@/components/Photo';
import { Card, ProgressBar, Screen, SectionHeader, StatCard, Txt } from '@/components/ui';
import { money } from '@/lib/format';
import { photos } from '@/lib/images';
import { periodStats, progress, weeklyGoals, type Period, type WeeklyGoal } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// Progress (mockup screen 5): this week / this month / total, the photo card, and this week's goals.
const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'total', label: 'Total' },
];

export default function Progress() {
  const t = useTheme();
  const { state } = useStore();
  const [period, setPeriod] = useState<Period>('week');
  const stats = periodStats(state, period);
  const streak = progress(state).streak;
  const goals = weeklyGoals(state);
  const hasSpend = !!state.onboarding?.weeklySpend;

  const goalIcon: Record<WeeklyGoal['id'], { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    sessions: { name: 'calendar', color: t.success },
    money: { name: 'cash', color: t.success },
    gambleFree: { name: 'sunny', color: t.mission },
  };

  return (
    <Screen tab>
      <Txt variant="title">Your progress</Txt>

      {/* This week / This month / Total. */}
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: t.card, borderRadius: radius.pill, padding: 4 }}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: period === p.id }}
            onPress={() => setPeriod(p.id)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 9,
              borderRadius: radius.pill,
              backgroundColor: period === p.id ? t.text : 'transparent',
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: period === p.id ? t.bg : t.textMuted }}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        {hasSpend ? <StatCard icon="cash" iconColor={t.success} value={money(stats.moneyKept)} label="Money kept" /> : null}
        <StatCard icon="sunny" iconColor={t.mission} value={String(stats.gambleFreeDays)} label="Gamble-free days" />
        <StatCard icon="checkmark-circle" iconColor={t.success} value={String(stats.sessions)} label="Sessions done" />
      </View>
      <Txt variant="small">
        {streak} {streak === 1 ? 'day' : 'days'} in a row right now · {stats.urgesHandled} {stats.urgesHandled === 1 ? 'urge' : 'urges'}{' '}
        ridden out {period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'so far'}
      </Txt>

      {/* A reminder of what it's all for (the owner's photo; a plain space until progress.jpg arrives). */}
      <Photo source={photos.progress} fade="left" style={{ minHeight: 150, justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 38, color: t.text, padding: space.xl }}>
          {'LESS NOISE.\nMORE OF THIS.'}
        </Text>
      </Photo>

      <SectionHeader title="Weekly goals" />
      <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.cardBorder }}>
        {goals.map((g, i) => (
          <View
            key={g.id}
            style={{ padding: space.lg, gap: space.sm, backgroundColor: t.card, borderTopWidth: i ? 1 : 0, borderTopColor: t.cardBorder }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Ionicons name={goalIcon[g.id].name} size={20} color={goalIcon[g.id].color} />
              <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: t.text }}>{g.label}</Text>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: g.at >= g.of ? t.success : t.textMuted }}>
                {g.id === 'money' ? `${money(g.at)} / ${money(g.of)}` : `${g.at}/${g.of}`}
              </Text>
            </View>
            <ProgressBar at={g.at} of={g.of} />
          </View>
        ))}
      </View>
      <Card>
        <Txt variant="muted">Goals reset every Monday. Missed one? No stress. Every day you show up still counts.</Txt>
      </Card>
    </Screen>
  );
}
