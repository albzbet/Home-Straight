import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { radius, useTheme } from '@/lib/theme';

// Small pill in the top corner of every screen.
export function GetHelpButton() {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get help now"
      onPress={() => router.push('/help')}
      hitSlop={8}
      style={({ pressed }) => ({
        backgroundColor: t.help,
        borderRadius: radius.pill,
        paddingVertical: 7,
        paddingHorizontal: 14,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: t.helpInk, fontWeight: '700', fontSize: 14 }}>Get help now</Text>
    </Pressable>
  );
}
