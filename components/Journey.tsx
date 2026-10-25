import { View } from 'react-native';
import { Card, Txt } from '@/components/ui';
import { weeks } from '@/lib/content';
import { dayStatus, weekOf } from '@/lib/program';
import type { DayRecord } from '@/lib/types';
import { radius, space, useTheme } from '@/lib/theme';

// The 6-week path on Home: six stops joined by a line, with this week's seven days underneath.
export function Journey({ days, currentDay }: { days: DayRecord[]; currentDay: number | null }) {
  const t = useTheme();
  const week = currentDay ? weekOf(currentDay) : 6;
  const theme = weeks.find((w) => w.week === week)!;
  const doneInWeek = (w: number) => days.filter((d) => weekOf(d.day) === w).length;

  return (
    <Card>
      <Txt variant="label">Your journey</Txt>
      <View style={{ height: 40, justifyContent: 'center' }}>
        {/* The line behind the stops: grey, filled in green up to this week. */}
        <View style={{ position: 'absolute', left: 14, right: 14, height: 3, backgroundColor: t.line }} />
        <View style={{ position: 'absolute', left: 14, width: `${((week - 1) / 5) * 100 * 0.9}%`, height: 3, backgroundColor: t.action }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {weeks.map((w) => {
            const finished = doneInWeek(w.week) === 7;
            const current = w.week === week && !finished;
            return (
              <View
                key={w.week}
                accessibilityLabel={`Week ${w.week}${finished ? ', done' : current ? ', this week' : ''}`}
                style={{
                  width: current ? 36 : 28,
                  height: current ? 36 : 28,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: finished ? t.action : current ? t.soft : t.surface,
                  borderWidth: 2,
                  borderColor: finished || current ? t.action : t.line,
                }}
              >
                <Txt variant="small" style={{ fontWeight: '700', color: finished ? t.actionInk : current ? t.action : t.muted }}>
                  {String(w.week)}
                </Txt>
              </View>
            );
          })}
        </View>
      </View>
      <View style={{ gap: space.xs }}>
        <Txt variant="h2">
          Week {week}: {theme.theme}
        </Txt>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {Array.from({ length: 7 }, (_, i) => {
            const day = (week - 1) * 7 + i + 1;
            const status = dayStatus(day, days);
            return (
              <View
                key={day}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: status === 'done' ? t.action : status === 'today' ? t.accent : t.line,
                }}
              />
            );
          })}
        </View>
        <Txt variant="small">{doneInWeek(week)} of 7 sessions this week</Txt>
      </View>
    </Card>
  );
}
