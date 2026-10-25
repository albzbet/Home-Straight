import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCrisisGate } from '@/components/Help';
import { Button, Card, Field, PrimaryButton, ProgressBar, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { money, parseMoney } from '@/lib/format';
import { localDate } from '@/lib/program';
import { goalProgress } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { fonts, radius, space, useTheme } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const ideas = config.goals.ideas as { label: string; icon: IconName }[];

// The icon for a goal: the matching goal idea's, or a flag.
const iconFor = (name: string): IconName => ideas.find((i) => name.toLowerCase().includes(i.label.toLowerCase()))?.icon ?? 'flag';

// Goal tracking (mockup screen 9): the savings goal with money kept towards it, changing it, and other goal ideas.
// Money kept is an estimate: their usual weekly spend for every gamble-free day since the goal was set.
export default function GoalScreen() {
  const t = useTheme();
  const { state, saveOnboarding } = useStore();
  const o = state.onboarding;
  const goal = goalProgress(state);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [spend, setSpend] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();
  if (!o) return <Redirect href="/" />;

  const edit = (newName: string, newTarget: number | null) => {
    setName(newName);
    setTarget(newTarget ? String(newTarget) : '');
    setSpend(o.weeklySpend ? String(o.weeklySpend) : '');
    setProblem(null);
    setEditing(true);
  };

  const save = () =>
    check([name], async () => {
      const amount = parseMoney(target);
      if (!amount) return setProblem('Pop in how much you need, in dollars.');
      setSaving(true);
      setProblem(null);
      // A new goal (a different name) starts from $0 today; changing the amount of the same goal keeps counting.
      const isNew = name.trim() !== o.savingFor.trim();
      try {
        await saveOnboarding({
          ...o,
          savingFor: name.trim(),
          savingTarget: amount,
          weeklySpend: parseMoney(spend) ?? o.weeklySpend,
          goalSince: isNew ? localDate() : (o.goalSince ?? null),
        });
        setEditing(false);
      } catch {
        setProblem("That didn't save. Check your internet connection and try again.");
      } finally {
        setSaving(false);
      }
    });

  if (editing)
    return (
      <Screen
        footer={
          <>
            {problem ? <Txt variant="small">{problem}</Txt> : null}
            <PrimaryButton label="Save goal" onPress={save} loading={saving} />
            <Button label="Cancel" kind="ghost" onPress={() => setEditing(false)} />
          </>
        }
      >
        {sheet}
        <Txt variant="title">{goal ? 'Change your goal' : 'Set a goal'}</Txt>
        <Field label="What are you saving for?" placeholder="e.g. A trip to Bali" value={name} onChangeText={setName} maxLength={60} />
        <Field label="How much do you need?" placeholder="$" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
        <Field
          label="What you'd usually spend on gambling in a week"
          placeholder="$"
          value={spend}
          onChangeText={setSpend}
          keyboardType="decimal-pad"
        />
        <Txt variant="small">
          Money kept is worked out from this: your usual weekly spend for every gamble-free day. A new goal starts from $0 today.
        </Txt>
      </Screen>
    );

  return (
    <Screen>
      <Txt variant="title">Your goal</Txt>

      {goal ? (
        <Card raised>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt style={{ fontFamily: fonts.semibold }}>{goal.name || 'Your goal'}</Txt>
              <Text accessibilityLabel={`${money(goal.kept)} of ${money(goal.target)}`}>
                <Text style={{ fontFamily: fonts.display, fontSize: 40, color: t.text }}>{money(goal.kept)}</Text>
                <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: t.textMuted }}> / {money(goal.target)}</Text>
              </Text>
            </View>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                backgroundColor: goal.reached ? t.successSoft : t.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={goal.reached ? 'trophy' : iconFor(goal.name)} size={30} color={goal.reached ? t.success : t.primary} />
            </View>
          </View>
          <ProgressBar at={goal.kept} of={goal.target} height={10} />
          <Txt variant="small">
            {goal.reached
              ? "You've made it. That's money that stayed yours."
              : goal.weeksToGo
                ? `About ${goal.weeksToGo} ${goal.weeksToGo === 1 ? 'week' : 'weeks'} to go, one gamble-free day at a time.`
                : 'Add what you used to spend in a week and we can work out how close you are.'}
          </Txt>
        </Card>
      ) : (
        <Card>
          <Txt>Having something to put the money towards makes every gamble-free day count for something.</Txt>
        </Card>
      )}

      {goal?.reached ? (
        <PrimaryButton label="Set your next goal" icon="flag" onPress={() => edit('', null)} />
      ) : goal ? (
        <Button label="Change goal" kind="secondary" onPress={() => edit(o.savingFor, o.savingTarget)} />
      ) : (
        <PrimaryButton label="Set a goal" icon="flag" onPress={() => edit('', null)} />
      )}
      <Txt variant="small">Money kept is an estimate: your usual weekly spend for every gamble-free day.</Txt>

      <Txt variant="label">{goal ? 'Other goal ideas' : 'Goal ideas'}</Txt>
      <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.cardBorder }}>
        {ideas.map((idea, i) => (
          <Pressable
            key={idea.label}
            accessibilityRole="button"
            accessibilityLabel={`Save for: ${idea.label}`}
            onPress={() => edit(idea.label, null)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.lg,
              backgroundColor: pressed ? t.cardRaised : t.card,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: t.cardBorder,
            })}
          >
            <Ionicons name={idea.icon} size={20} color={[t.success, t.primary, t.mission][i % 3]} />
            <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: t.text }}>{idea.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
