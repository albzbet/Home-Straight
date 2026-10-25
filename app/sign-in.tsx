import { Redirect, router } from 'expo-router';
import { AccountForm } from '@/components/AccountForm';
import { Button, Screen, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';

// For people who already have an account (new phone, or signed out).
export default function SignIn() {
  const { signedIn } = useStore();
  if (signedIn) return <Redirect href="/" />;
  return (
    <Screen>
      <Txt variant="title">Welcome back</Txt>
      <Txt variant="muted">Sign in the same way you did before.</Txt>
      <AccountForm askNickname={false} />
      <Button label="Privacy policy" kind="ghost" onPress={() => router.push('/privacy')} />
    </Screen>
  );
}
