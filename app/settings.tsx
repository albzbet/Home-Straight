import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, confirm, Screen, Txt } from '@/components/ui';
import { signOut } from '@/lib/auth';
import { config } from '@/lib/config';
import { useStore } from '@/lib/store';

export default function Settings() {
  const { signedIn, state, deleteMyData } = useStore();
  const [deleting, setDeleting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const remove = () =>
    confirm(
      'Delete my data?',
      signedIn
        ? 'This permanently deletes your account and everything you have saved. It cannot be undone.'
        : 'This deletes everything saved on this phone. It cannot be undone.',
      'Delete',
      async () => {
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
      },
    );

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
        <Button label="Delete my data" kind="secondary" onPress={remove} loading={deleting} />
        {problem ? <Txt variant="small">{problem}</Txt> : null}
      </Card>
      <Button label="Privacy policy" kind="ghost" onPress={() => router.push('/privacy')} />
      <Button label="Terms of use" kind="ghost" onPress={() => router.push('/terms')} />
      <Txt variant="small">{config.help.disclaimer}</Txt>
    </Screen>
  );
}
