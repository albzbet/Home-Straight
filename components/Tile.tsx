import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// A quick-access square on Home: coloured icon, title and a short line underneath.
export function Tile({
  icon,
  color,
  title,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexBasis: '47%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: pressed ? t.cardRaised : t.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: t.cardBorder,
        paddingVertical: space.md,
        paddingHorizontal: 12,
        minHeight: 72,
      })}
    >
      <View
        style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={icon} size={18} color={t.onPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, color: t.text }} numberOfLines={2}>
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: t.textMuted }} numberOfLines={2}>
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}
