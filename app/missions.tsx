import { Card, Screen, Txt } from '@/components/ui';

// This week's mission. The full mockup screen (mission card with photo, "I've done it", all missions) is still to come.
export default function Missions() {
  return (
    <Screen>
      <Txt variant="title">This week's mission</Txt>
      <Card>
        <Txt variant="muted">Real-life challenges, like getting outside for 30 minutes. Coming soon.</Txt>
      </Card>
    </Screen>
  );
}
