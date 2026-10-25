import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { fonts, radius, useTheme } from '@/lib/theme';

// The two pills along the top of every screen: Urge SOS on the left, Get help now on the right.
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
      <Text style={{ color: t.helpInk, fontFamily: fonts.semibold, fontSize: 14 }}>Get help now</Text>
    </Pressable>
  );
}

export function SosButton() {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Urge SOS: help riding out an urge"
      onPress={() => router.push('/sos')}
      hitSlop={8}
      style={({ pressed }) => ({
        borderWidth: 1.5,
        borderColor: t.action,
        backgroundColor: 'transparent',
        borderRadius: radius.pill,
        paddingVertical: 6,
        paddingHorizontal: 14,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: t.action, fontFamily: fonts.semibold, fontSize: 14 }}>Urge SOS</Text>
    </Pressable>
  );
}
