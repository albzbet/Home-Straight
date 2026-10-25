import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { VideoCard } from '@/components/SessionMedia';
import { Card, Screen, Txt } from '@/components/ui';
import { useContent } from '@/lib/content';
import { highlightTail } from '@/lib/format';
import { photos } from '@/lib/images';
import { fonts, space, useTheme } from '@/lib/theme';

// One Bookie Tricks Exposed episode: the video (or its script until it's uploaded), what it's about and the key points.
export default function EpisodeScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { episodes } = useContent();
  const e = episodes.find((x) => x.id === id);
  if (!e) return <Redirect href="/explore" />;
  const [plain, lit] = highlightTail(e.title);
  const [m, s] = e.duration.split(':').map(Number);
  return (
    <Screen>
      <Txt variant="label">
        Bookie Tricks Exposed · EP {e.number} · {e.duration}
      </Txt>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 46, color: t.text }}>
        {plain.toUpperCase()}
        <Text style={{ color: t.primary }}>{lit.toUpperCase()}</Text>
      </Text>
      <VideoCard
        url={e.video.url}
        script={e.video.script}
        poster={photos.tricks[e.number - 1] ?? null}
        seconds={(m || 0) * 60 + (s || 0)}
      />
      <Txt>{e.summary}</Txt>
      <Card>
        <Txt variant="label">Key points</Txt>
        {e.points.map((p) => (
          <View key={p} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
            <Ionicons name="checkmark-circle" size={18} color={t.success} style={{ marginTop: 3 }} />
            <Txt style={{ flex: 1 }}>{p}</Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
