import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Photo } from '@/components/Photo';
import { Button, Card, PrimaryButton, Screen, Txt } from '@/components/ui';
import { useContent, type Mission } from '@/lib/content';
import { photos } from '@/lib/images';
import { isDone, missionOfTheWeek, mondayOf, timesDone } from '@/lib/missions';
import { localDate } from '@/lib/program';
import { useStore } from '@/lib/store';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// Weekly missions (mockup screen 8): this week's real-life challenge with a photo, "I've done it", and all the missions.
// Nothing to win: ticking one off just marks it done (lib/missions.ts picks the week's one).
export default function Missions() {
  const t = useTheme();
  const { state, saveMission } = useStore();
  const { missions } = useContent();
  const thisWeek = missionOfTheWeek(missions, state);
  const [view, setView] = useState<'week' | 'all' | string>('week'); // or a mission's id
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const week = mondayOf(localDate());
  const doneCount = state.missions.length;

  if (!thisWeek)
    return (
      <Screen>
        <Txt variant="title">This week's mission</Txt>
        <Txt variant="muted">No missions yet. Check back soon.</Txt>
      </Screen>
    );

  const tick = async (m: Mission, done: boolean) => {
    setSaving(true);
    setProblem(null);
    try {
      await saveMission({ missionId: m.id, weekOf: week, at: new Date().toISOString() }, done);
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (view === 'all')
    return (
      <Screen footer={<Button label="Back to this week's mission" kind="ghost" onPress={() => setView('week')} />}>
        <Txt variant="title">All missions</Txt>
        <Txt variant="muted">A new one comes up each Monday. You can try any of them, any time.</Txt>
        {missions.map((m) => {
          const times = timesDone(state, m.id);
          const current = m.id === thisWeek.mission.id;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={`${m.title}${current ? ', this week' : ''}${times ? `, done ${times === 1 ? 'once' : `${times} times`}` : ''}`}
              onPress={() => setView(m.id)}
            >
              <Card style={current ? { borderColor: t.primary } : undefined}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1, gap: space.xs }}>
                    {current ? (
                      <Txt variant="label" style={{ color: t.primary }}>
                        This week
                      </Txt>
                    ) : null}
                    <Txt style={{ fontFamily: fonts.semibold }}>{m.title}</Txt>
                    {times ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                        <Ionicons name="checkmark-circle" size={16} color={t.success} />
                        <Txt variant="small">Done {times === 1 ? 'once' : `${times} times`}</Txt>
                      </View>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </Screen>
    );

  const mission = view === 'week' ? thisWeek.mission : (missions.find((m) => m.id === view) ?? thisWeek.mission);
  const isThisWeeks = mission.id === thisWeek.mission.id;
  const done = isDone(state, mission.id, week);

  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          {done ? (
            <Button label="Not done yet? Take the tick off" kind="ghost" onPress={() => tick(mission, false)} disabled={saving} />
          ) : (
            <PrimaryButton label="I've done it" icon="checkmark" onPress={() => tick(mission, true)} loading={saving} />
          )}
          {view === 'week' ? (
            <Button label="View all missions" kind="secondary" onPress={() => setView('all')} />
          ) : (
            <Button label="Back to all missions" kind="secondary" onPress={() => setView('all')} />
          )}
        </>
      }
    >
      <Photo source={photos.mission} fade="bottom" style={{ height: 200, justifyContent: 'flex-end', padding: space.lg }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: t.text }}>
          {isThisWeeks ? "THIS WEEK'S MISSION" : 'MISSION'}
        </Text>
      </Photo>
      <Text style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 40, color: t.text }}>{mission.title.toUpperCase()}</Text>
      {done ? (
        <Card style={{ borderColor: t.success, backgroundColor: t.successSoft }}>
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={32} color={t.success} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: fonts.semibold }}>Done. Good on you.</Txt>
              <Txt variant="small">{doneCount === 1 ? 'Your first mission ticked off.' : `${doneCount} missions ticked off so far.`}</Txt>
            </View>
          </View>
        </Card>
      ) : null}
      <Txt variant="muted">{mission.body}</Txt>
      {mission.ideas.length ? (
        <Card>
          <Txt variant="label">A few ideas</Txt>
          {mission.ideas.map((idea) => (
            <View key={idea} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: radius.pill, backgroundColor: t.primary }} />
              <Txt style={{ flex: 1 }}>{idea}</Txt>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
