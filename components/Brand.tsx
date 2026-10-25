import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { GetHelpButton } from '@/components/GetHelpButton';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// The app's name: HOMESTR in white and the 8 in orange, with the sunrise mark. (Swapped for the owner's logo files when
// they arrive: assets/logo.)
export function Wordmark({ size = 26 }: { size?: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }} accessible accessibilityLabel="homestr8">
      <MaterialCommunityIcons name="weather-sunset-up" size={Math.round(size * 0.95)} color={t.primary} />
      <Text style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.05, letterSpacing: 0.8, color: t.text }}>
        HOMESTR<Text style={{ color: t.primary }}>8</Text>
      </Text>
    </View>
  );
}

// The top of every main tab: the name on the left; Urge SOS and Get help now on the right, one tap from anywhere.
export function BrandHeader() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Wordmark />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Urge SOS"
          onPress={() => router.push('/sos')}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.cardBorder,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="pulse" size={18} color={t.sos} />
        </Pressable>
        <GetHelpButton />
      </View>
    </View>
  );
}
