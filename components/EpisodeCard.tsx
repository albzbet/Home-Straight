import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { Episode } from '@/lib/content';
import { highlightTail } from '@/lib/format';
import { photos } from '@/lib/images';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// One Bookie Tricks Exposed episode in the list (mockup screen 6): thumbnail with a play button, EP number, the title in
// big capitals with its last word in copper, and the length.
export function EpisodeCard({ episode }: { episode: Episode }) {
  const t = useTheme();
  const thumb = photos.tricks[episode.number - 1] ?? null;
  const [plain, lit] = highlightTail(episode.title);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Episode ${episode.number}: ${episode.title}, ${episode.duration}`}
      onPress={() => router.push(`/episode/${episode.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        minHeight: 150,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: pressed ? t.cardRaised : t.card,
        borderWidth: 1,
        borderColor: t.cardBorder,
      })}
    >
      <View style={{ width: '44%', backgroundColor: t.slate, alignItems: 'center', justifyContent: 'center' }}>
        {thumb ? (
          <Image source={thumb} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[t.cardRaised, t.bg]} style={{ position: 'absolute', inset: 0 }} />
        )}
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="play" size={20} color={t.bg} style={{ marginLeft: 3 }} />
        </View>
      </View>
      <View style={{ flex: 1, padding: space.md, justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1, color: t.textMuted }}>EP {episode.number}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 30, color: t.text }}>
            {plain.toUpperCase()}
            <Text style={{ color: t.primary }}>{lit.toUpperCase()}</Text>
          </Text>
        </View>
        <Text style={{ alignSelf: 'flex-end', fontFamily: fonts.medium, fontSize: 12, color: t.textMuted }}>{episode.duration}</Text>
      </View>
    </Pressable>
  );
}
