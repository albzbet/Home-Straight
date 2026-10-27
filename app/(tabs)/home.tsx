import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { BetstopCard } from '@/components/Betstop';
import { Photo } from '@/components/Photo';
import { Tile } from '@/components/Tile';
import { Button, Card, ProgressBar, Screen, StatCard, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { useContent } from '@/lib/content';
import { money } from '@/lib/format';
import { photos } from '@/lib/images';
import { FREE_DAYS, localDate, today, TOTAL_DAYS, TOTAL_WEEKS, weekOf } from '@/lib/program';
import { breakStatus, limitsThisWeek } from '@/lib/goalPlan';
import { missionOfTheWeek } from '@/lib/missions';
import { goalProgress, progress } from '@/lib/progress';
import { isPaused } from '@/lib/reminderPlan';
import { remindersSupported, useRemindersOn } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// Home dashboard (mockup screen 2): greeting, where you're up to in the program, streak and money kept, today's session,
// and quick ways into Urge SOS, the daily check-in, this week's mission and Bookie Tricks Exposed.
export default function Home() {
  const th = useTheme();
  const { state, signedIn, setPause } = useStore();
  const { lesson, week, meditationOfTheDay, missions } = useContent();
  const [remindOn, setRemindOn] = useRemindersOn();
  if (!state.onboarding) return <Redirect href="/" />;

  const t = today(state.days);
  const next = t.day ? lesson(t.day) : undefined;
  const prev = t.day ? lesson(t.day - 1) : undefined;
  const needsAccount = !!t.day && t.day > FREE_DAYS && !signedIn;
  const paused = isPaused(state);
  const finished = !t.day;
  const p = progress(state);
  const mission = missionOfTheWeek(missions, state);
  const goal = goalProgress(state);
  const limits = limitsThisWeek(state);
  const onBreak = state.onboarding?.goal === 'break' ? breakStatus(state.onboarding.break) : null;
  const o = state.onboarding;
  const now = new Date();
  const todayDate = localDate(now);
  const currentWeek = t.day ? weekOf(t.day) : TOTAL_WEEKS;
  const theme = week(currentWeek);
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const name = state.nickname ? `, ${state.nickname}` : '';

  // The big button changes with where they're up to.
  const action = paused
    ? { label: 'Pick up where I left off', icon: 'play' as const, go: () => setPause(false).catch(() => {}) }
    : finished
      ? state.questionnaires.some((q) => q.kind === 'end')
        ? { label: 'Daily check-in', icon: 'checkmark-circle' as const, go: () => router.push('/checkin') }
        : { label: "See how far you've come", icon: 'trophy' as const, go: () => router.push('/finish') }
      : needsAccount
        ? { label: 'Save your progress to keep going', icon: 'person-add' as const, go: () => router.push('/save-progress') }
        : t.unlocked
          ? { label: "Start today's session", icon: 'play' as const, go: () => router.push(`/session/${t.day}`) }
          : null;

  return (
    <Screen tab>
      {/* Greeting over the Home photo (a plain dark space until the owner's home.jpg arrives). */}
      <Photo source={photos.home} style={{ marginHorizontal: -space.xl, borderRadius: 0, minHeight: 190, justifyContent: 'flex-end' }}>
        <View style={{ padding: space.xl, gap: space.xs }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: th.textMuted }}>
            {now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 44, color: th.text }}>
            {`${greeting}${name},\nlet's keep\nit going.`.toUpperCase()}
          </Text>
        </View>
      </Photo>

      {paused ? (
        <Card>
          <Txt variant="label">On a break</Txt>
          <Txt variant="muted">Your program is paused. Everything is waiting right where you left it.</Txt>
        </Card>
      ) : null}

      {/* Where they're up to. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Week ${currentWeek} of ${TOTAL_WEEKS}: ${theme?.theme ?? ''}. See all weeks.`}
        onPress={() => router.push('/program')}
        style={({ pressed }) => ({
          backgroundColor: pressed ? th.cardRaised : th.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: th.cardBorder,
          padding: space.lg,
          gap: space.sm,
        })}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: th.textMuted }}>
              Week {currentWeek} of {TOTAL_WEEKS}
            </Text>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: th.text }}>{theme?.theme}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={th.textMuted} />
        </View>
        <ProgressBar at={state.days.length} of={TOTAL_DAYS} />
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: th.textFaint }}>
          {state.days.length} of {TOTAL_DAYS} sessions done
        </Text>
      </Pressable>

      {/* Streak (with the total, so a slip never wipes out progress) and money kept. */}
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard
          icon="flame"
          iconColor={th.primary}
          value={String(p.streak)}
          label={p.streak === 1 ? 'Day in a row' : 'Days in a row'}
          sub={`${p.gambleFreeDays} gamble-free in total`}
        />
        {o.weeklySpend ? (
          <StatCard
            icon="cash"
            iconColor={th.success}
            value={money(p.moneyKept)}
            label="Money kept"
            sub={goal ? `${Math.round(goal.share * 100)}% of the way to ${goal.name || 'your goal'}` : 'an estimate'}
            onPress={() => router.push('/goal')}
          />
        ) : (
          <StatCard icon="checkmark-circle" iconColor={th.success} value={String(state.days.length)} label="Sessions done" />
        )}
      </View>

      {/* Today's session. */}
      {action ? (
        <Button label={action.label} kind="light" icon={action.icon} onPress={action.go} />
      ) : (
        <Card>
          <Txt variant="label">Today</Txt>
          <Txt>That's today's session done. Good on you.</Txt>
          <Txt variant="muted">{prev?.teaser ?? `Day ${t.day} opens tomorrow.`}</Txt>
        </Card>
      )}
      {action && t.unlocked && next && !needsAccount && !paused ? (
        <Txt variant="small" style={{ textAlign: 'center', marginTop: -space.sm }}>
          Day {t.day}: {next.title} · about 10 minutes, or 5 on a busy day
        </Txt>
      ) : null}

      {/* Cutting back: this week against their limits. Taking a break: how far through it, or what's next once it ends. */}
      {limits ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/aim')}>
          <Card>
            <Txt variant="label">Your limits this week</Txt>
            {limits.weeklyMoney !== null ? (
              <>
                <Txt>
                  {money(limits.spent)} of {money(limits.weeklyMoney)}
                </Txt>
                <ProgressBar at={limits.spent} of={limits.weeklyMoney} color={limits.withinMoney ? undefined : th.primary} />
              </>
            ) : null}
            {limits.daysPerWeek !== null ? (
              <>
                <Txt>
                  {limits.days} of {limits.daysPerWeek} {limits.daysPerWeek === 1 ? 'day' : 'days'}
                </Txt>
                <ProgressBar at={limits.days} of={Math.max(1, limits.daysPerWeek)} color={limits.withinDays ? undefined : th.primary} />
              </>
            ) : null}
            <Txt variant="small">
              {limits.withinMoney && limits.withinDays
                ? 'Within your limits so far. Fresh week every Monday.'
                : "Over this week. No beating yourself up: Monday's a fresh start. Tap to look at your limits."}
            </Txt>
          </Card>
        </Pressable>
      ) : null}
      {onBreak ? (
        onBreak.ended ? (
          <Card raised>
            <Txt variant="label">Your break is done</Txt>
            <Txt>You made it. Take a moment to notice what's been different, then choose what comes next.</Txt>
            <Button label="What's next?" icon="compass" onPress={() => router.push('/aim')} />
          </Card>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.push('/aim')}>
            <Card>
              <Txt variant="label">Your break</Txt>
              <Txt>
                Day {onBreak.day} of {onBreak.total} · {onBreak.daysLeft} {onBreak.daysLeft === 1 ? 'day' : 'days'} to go
              </Txt>
              <ProgressBar at={onBreak.day} of={onBreak.total} />
            </Card>
          </Pressable>
        )
      ) : null}

      {/* Stopping completely and not on BetStop yet: recommend it until they tick it off on the BetStop screen. */}
      {o.goal === 'quit' && !o.betstopAt ? <BetstopCard /> : null}

      {/* No if-then plans yet: suggest making one (after Day 1, so the first morning isn't crowded). */}
      {!state.plans.length && state.days.length > 0 ? (
        <Card>
          <Txt variant="label">Plan ahead</Txt>
          <Txt>Pick a risky moment and decide now what you'll do instead. It takes a minute.</Txt>
          <Button label="Make an if-then plan" kind="secondary" icon="git-branch" onPress={() => router.push('/plans')} />
        </Card>
      ) : null}

      {/* Quick access. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Tile icon="pulse" color={th.sos} title="Urge SOS" sub="Get support now" onPress={() => router.push('/sos')} />
        <Tile
          icon="checkmark-done"
          color={th.success}
          title="Daily check-in"
          sub="How are you today?"
          onPress={() => router.push('/checkin')}
        />
        <Tile
          icon="trail-sign"
          color={th.mission}
          title="This week's mission"
          sub={mission ? (mission.done ? 'Done this week' : mission.mission.title) : 'Something to try'}
          onPress={() => router.push('/missions')}
        />
        <Tile
          icon="play"
          color={th.explore}
          title="Bookie Tricks Exposed"
          sub="Watch the latest episode"
          onPress={() => router.push('/explore')}
        />
      </View>

      {finished && state.questionnaires.some((q) => q.kind === 'end') ? (
        <Card>
          <Txt variant="label">Today's meditation</Txt>
          <Txt>
            {meditationOfTheDay(todayDate).title} ({meditationOfTheDay(todayDate).minutes} min)
          </Txt>
          <Button label="Listen" kind="secondary" onPress={() => router.push(`/meditation/${meditationOfTheDay(todayDate).id}`)} />
        </Card>
      ) : null}

      {remindersSupported && remindOn === false && !paused && state.days.length > 0 ? (
        <Card>
          <Txt variant="label">Morning reminder</Txt>
          <Txt variant="muted">A quiet nudge at the time you picked. It never mentions gambling.</Txt>
          <Button label="Turn on reminders" kind="secondary" onPress={() => setRemindOn(true)} />
        </Card>
      ) : null}

      <Txt variant="small" style={{ color: th.textFaint }}>
        {config.help.disclaimer}
      </Txt>
    </Screen>
  );
}
