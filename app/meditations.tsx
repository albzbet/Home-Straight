import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Screen, Txt } from '@/components/ui';
import { useContent } from '@/lib/content';
import { radius, space, useTheme } from '@/lib/theme';

// The meditation library: short audio for everyday moments.
export default function Meditations() {
  const t = useTheme();
  const { meditations } = useContent();
  return (
    <Screen>
      <Txt variant="title">Meditations</Txt>
      <Txt variant="muted">Short guided audio for the moments that matter. Headphones help.</Txt>
      <View style={{ gap: space.sm }}>
        {meditations.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            onPress={() => router.push(`/meditation/${m.id}`)}
            style={({ pressed }) => ({
              backgroundColor: t.surface,
              borderColor: t.line,
              borderWidth: 1,
              borderRadius: radius.md,
              padding: space.lg,
              gap: 2,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Txt variant="h2">{m.title}</Txt>
            <Txt variant="muted">
              {m.minutes} min · {m.summary}
            </Txt>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
