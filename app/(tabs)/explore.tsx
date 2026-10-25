import { router } from 'expo-router';
import { Button, Card, Screen, SectionHeader, Txt } from '@/components/ui';

// Explore tab. Bookie Tricks Exposed (episode list) is still to come; the meditations are here already.
export default function Explore() {
  return (
    <Screen tab>
      <Txt variant="title">Explore</Txt>
      <SectionHeader title="Bookie Tricks Exposed" />
      <Card>
        <Txt variant="muted">Short episodes on how gambling companies keep people hooked. Coming soon.</Txt>
      </Card>
      <SectionHeader title="Meditations" action="See all" onAction={() => router.push('/meditations')} />
      <Card>
        <Txt variant="muted">Short guided audio for the moments that matter.</Txt>
        <Button label="Open the meditations" kind="secondary" onPress={() => router.push('/meditations')} />
      </Card>
    </Screen>
  );
}
