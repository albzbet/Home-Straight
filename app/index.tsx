import { Redirect } from 'expo-router';
import { Button, Loading, Screen, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';

// Sends people to the right place: welcome, onboarding, Day 1, nickname, or home.
export default function Index() {
  const { loading, error, reload, signedIn, state } = useStore();
  if (loading) return <Loading />;
  if (error)
    return (
      <Screen>
        <Txt variant="h2">Hmm, something went wrong</Txt>
        <Txt variant="muted">{error}</Txt>
        <Button label="Try again" onPress={reload} />
      </Screen>
    );
  if (!state.adultConfirmedAt) return <Redirect href="/welcome" />;
  if (!state.onboarding) return <Redirect href="/onboarding" />;
  if (!state.days.some((d) => d.day === 1)) return <Redirect href="/session/1" />;
  if (signedIn && !state.nickname) return <Redirect href="/save-progress" />;
  return <Redirect href="/home" />;
}
