import { router } from 'expo-router';
import { useState } from 'react';
import { PrivacySettings } from '@/components/PrivacySettings';
import { Button, Card, Chip, Row, Screen, Txt } from '@/components/ui';
import { signOut } from '@/lib/auth';
import { useIsAdmin } from '@/lib/admin';
import { config } from '@/lib/config';
import { timeLabel } from '@/lib/format';
import { isPaused } from '@/lib/reminderPlan';
import { remindersSupported, useRemindersOn } from '@/lib/reminders';
import { useStore } from '@/lib/store';

export default function Settings() {
  const { signedIn, state, deleteMyData, saveOnboarding, setPause } = useStore();
  const [remindOn, setRemindOn] = useRemindersOn();
  const admin = useIsAdmin();
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // "Are you sure?" shown on the screen itself, so it works the same on phones and in a web browser.
  const [asking, setAsking] = useState(false);

  const remove = async () => {
    setDeleting(true);
    setProblem(null);
    try {
      await deleteMyData();
      router.replace('/');
    } catch {
      setProblem("That didn't work. Check your internet connection and try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Txt variant="label">Account</Txt>
        <Txt>{signedIn ? `Signed in as ${state.nickname ?? 'you'}` : 'Not signed in. Your progress is saved on this phone only.'}</Txt>
        {signedIn ? (
          <Button label="Sign out" kind="secondary" onPress={() => signOut().then(() => router.replace('/'))} />
        ) : (
          <Button label="Save my progress" onPress={() => router.push('/save-progress')} />
        )}
      </Card>
      {state.onboarding ? (
        <Card>
          <Txt variant="label">Morning reminder</Txt>
          {remindersSupported ? (
            <>
              <Txt variant="muted">
                {remindOn
                  ? `On, at ${timeLabel(state.onboarding.reminderTime)}. The wording never mentions gambling.`
                  : 'Off. A gentle nudge at the time you choose. The wording never mentions gambling.'}
              </Txt>
              <Button
                label={remindOn ? 'Turn off' : 'Turn on'}
                kind="secondary"
                loading={busy === 'remind'}
                onPress={async () => {
                  setBusy('remind');
                  await setRemindOn(!remindOn).finally(() => setBusy(null));
                }}
              />
              <Row>
                {config.onboarding.reminderTimes.map((t) => (
                  <Chip
                    key={t}
                    label={timeLabel(t)}
                    selected={state.onboarding!.reminderTime === t}
                    onPress={() => saveOnboarding({ ...state.onboarding!, reminderTime: t }).catch(() => {})}
                  />
                ))}
              </Row>
            </>
          ) : (
            <Txt variant="muted">Reminders work in the phone app.</Txt>
          )}
        </Card>
      ) : null}

      {state.onboarding ? (
        <Card>
          <Txt variant="label">Take a break from the program</Txt>
          {isPaused(state) ? (
            <>
              <Txt>
                {state.pause!.until
                  ? `Paused until ${new Date(`${state.pause!.until}T12:00:00`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}.`
                  : "Paused until you're ready."}{' '}
                No reminders in the meantime. Urge SOS and help are still here whenever you need them.
              </Txt>
              <Button
                label="Pick up where I left off"
                loading={busy === 'pause'}
                onPress={() => (setBusy('pause'), setPause(false).finally(() => setBusy(null)))}
              />
            </>
          ) : (
            <>
              <Txt variant="muted">Life gets busy. Pausing stops the reminders, and everything waits right where you left it.</Txt>
              <Row>
                {config.reminders.pauseOptions.map((opt) => (
                  <Chip key={opt.label} label={opt.label} selected={false} onPress={() => setPause(opt.days).catch(() => {})} />
                ))}
              </Row>
            </>
          )}
        </Card>
      ) : null}

      <PrivacySettings />

      <Card>
        <Txt variant="label">Your data</Txt>
        <Txt variant="muted">We never share or sell your data, and never share anything with gambling companies.</Txt>
        {asking ? (
          <>
            <Txt>
              {signedIn
                ? 'This permanently deletes your account and everything you have saved. It cannot be undone.'
                : 'This deletes everything saved on this phone. It cannot be undone.'}
            </Txt>
            <Button label="Yes, delete everything" kind="help" onPress={remove} loading={deleting} />
            <Button label="Cancel" kind="ghost" onPress={() => setAsking(false)} />
          </>
        ) : (
          <Button label="Delete my data" kind="secondary" onPress={() => setAsking(true)} />
        )}
        {problem ? <Txt variant="small">{problem}</Txt> : null}
      </Card>
      {admin ? <Button label="Admin" kind="ghost" onPress={() => router.push('/admin')} /> : null}
      <Button label="Privacy policy" kind="ghost" onPress={() => router.push('/privacy')} />
      <Button label="Terms of use" kind="ghost" onPress={() => router.push('/terms')} />
      <Txt variant="small">{config.help.disclaimer}</Txt>
    </Screen>
  );
}
