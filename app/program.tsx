import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { lessons, weeks } from '@/lib/content';
import { dayStatus, FREE_DAYS } from '@/lib/program';
import { useStore } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';

// All 6 weeks at a glance. Done sessions can be listened to again; today's opens; the rest wait their turn.
export default function Program() {
  const t = useTheme();
  const { state, signedIn } = useStore();

  return (
    <Screen>
      <Txt variant="title">Your 6 weeks</Txt>
      <Txt variant="muted">One new session each day. Missed one? It waits for you. Just pick up where you left off.</Txt>
      {weeks.map((w) => (
        <Card key={w.week}>
          <Txt variant="label">Week {w.week}</Txt>
          <Txt variant="h2">{w.theme}</Txt>
          <Txt variant="muted">{w.summary}</Txt>
          {state.days.some((d) => d.day === w.week * 7) ? (
            <Button label={`Week ${w.week} summary`} kind="secondary" onPress={() => router.push(`/week/${w.week}`)} />
          ) : null}
          <View style={{ gap: space.xs }}>
            {lessons
              .filter((l) => l.week === w.week)
              .map((l) => {
                const status = dayStatus(l.day, state.days);
                const needsAccount = !signedIn && l.day > FREE_DAYS && (status === 'today' || status === 'tomorrow');
                const open =
                  status === 'done'
                    ? () => router.push(`/session/${l.day}?review=1`)
                    : status === 'today'
                      ? () => router.push(needsAccount ? '/save-progress' : `/session/${l.day}`)
                      : undefined;
                const note = needsAccount
                  ? 'Free account needed'
                  : { done: 'Done · listen again', today: 'Ready now', tomorrow: 'Opens tomorrow', later: '' }[status];
                return (
                  <Pressable
                    key={l.day}
                    onPress={open}
                    disabled={!open}
                    accessibilityRole={open ? 'button' : undefined}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      paddingVertical: space.sm,
                      paddingHorizontal: space.sm,
                      borderRadius: radius.sm,
                      backgroundColor: status === 'today' ? t.soft : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: status === 'done' ? t.action : 'transparent',
                        borderWidth: 1.5,
                        borderColor: status === 'later' ? t.line : t.action,
                      }}
                    >
                      <Txt
                        variant="small"
                        style={{ color: status === 'done' ? t.actionInk : status === 'later' ? t.muted : t.action, fontWeight: '700' }}
                      >
                        {status === 'done' ? '✓' : String(l.day)}
                      </Txt>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt style={{ color: status === 'later' ? t.muted : t.ink }}>{l.title}</Txt>
                      {note ? <Txt variant="small">{note}</Txt> : null}
                    </View>
                  </Pressable>
                );
              })}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
