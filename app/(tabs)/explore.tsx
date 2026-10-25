import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { EpisodeCard } from '@/components/EpisodeCard';
import { Button, Card, Screen, SectionHeader, Txt } from '@/components/ui';
import { useContent } from '@/lib/content';
import { fonts, space, useTheme } from '@/lib/theme';

// Explore tab: Bookie Tricks Exposed (mockup screen 6), then the meditations.
export default function Explore() {
  const t = useTheme();
  const { episodes } = useContent();
  return (
    <Screen tab>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 46, color: t.text }}>
        BOOKIE TRICKS <Text style={{ color: t.primary }}>EXPOSED</Text>
      </Text>
      <Txt variant="muted">Short episodes on how gambling companies keep people hooked, and how to see it coming.</Txt>
      <View style={{ gap: space.md }}>
        {episodes.map((e) => (
          <EpisodeCard key={e.id} episode={e} />
        ))}
      </View>
      <SectionHeader title="Meditations" action="See all" onAction={() => router.push('/meditations')} />
      <Card>
        <Txt variant="muted">Short guided audio for the moments that matter.</Txt>
        <Button label="Open the meditations" kind="secondary" onPress={() => router.push('/meditations')} />
      </Card>
    </Screen>
  );
}
