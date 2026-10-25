import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { lessons, weeks } from '@/lib/content';
import { dayStatus, FREE_DAYS, nextDay } from '@/lib/program';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';

// All 6 weeks at a glance. Done sessions can be listened to again; today's opens; the rest wait their turn.
export default function Program() {
  const t = useTheme();
  const { state, signedIn, restartProgram } = useStore();
  const finished = nextDay(state.days) === null;
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <Txt variant="title">Your 6 weeks</Txt>
      <Txt variant="muted">One new session each day. Missed one? It waits for you. Just pick up where you left off.</Txt>
      {finished ? (
        <Card>
          <Txt variant="h2">Want to go again?</Txt>
          <Txt variant="muted">
            Repeat any week below, or start the whole program again from Day 1. Your gamble-free days and check-ins are kept either way.
          </Txt>
          {asking ? (
            <>
              <Button
                label="Yes, start again from Day 1"
                loading={busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    await restartProgram();
                    router.replace('/home');
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <Button label="Cancel" kind="ghost" onPress={() => setAsking(false)} />
            </>
          ) : (
            <Button label="Start the program again" kind="secondary" onPress={() => setAsking(true)} />
          )}
        </Card>
      ) : null}
      {weeks.map((w) => (
        <Card key={w.week}>
          <Txt variant="label">Week {w.week}</Txt>
          <Txt variant="h2">{w.theme}</Txt>
          <Txt variant="muted">{w.summary}</Txt>
          {state.days.some((d) => d.day === w.week * 7) ? (
            <Button label={`Week ${w.week} summary`} kind="secondary" onPress={() => router.push(`/week/${w.week}`)} />
          ) : null}
          {finished ? (
            <Button
              label={`Repeat week ${w.week}`}
              kind="secondary"
              onPress={() => router.push(`/session/${(w.week - 1) * 7 + 1}?repeat=1`)}
            />
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
