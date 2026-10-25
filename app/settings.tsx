import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { signOut } from '@/lib/auth';
import { config } from '@/lib/config';
import { useStore } from '@/lib/store';

export default function Settings() {
  const { signedIn, state, deleteMyData } = useStore();
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
      <Button label="Privacy policy" kind="ghost" onPress={() => router.push('/privacy')} />
      <Button label="Terms of use" kind="ghost" onPress={() => router.push('/terms')} />
      <Txt variant="small">{config.help.disclaimer}</Txt>
    </Screen>
  );
}
