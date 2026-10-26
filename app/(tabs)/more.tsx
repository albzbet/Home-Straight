import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { fonts, radius, space, useTheme } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const ITEMS: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Get help now', icon: 'call', href: '/help' },
  { label: 'Your goal', icon: 'flag', href: '/goal' },
  { label: 'If-then plans', icon: 'git-branch', href: '/plans' },
  { label: "What it's all about", icon: 'sunny', href: '/more-life' },
  { label: 'Block betting (BetStop)', icon: 'shield-checkmark', href: '/betstop' },
  { label: 'Your game plan', icon: 'document-text', href: '/plan' },
  { label: 'Meditations', icon: 'leaf', href: '/meditations' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
  { label: "Can't afford it? Free access", icon: 'heart', href: '/hardship' },
  { label: 'Refund policy', icon: 'card', href: '/refunds' },
  { label: 'Privacy policy', icon: 'lock-closed', href: '/privacy' },
  { label: 'Terms of use', icon: 'reader', href: '/terms' },
];

export default function More() {
  const t = useTheme();
  return (
    <Screen tab>
      <Txt variant="title">More</Txt>
      <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.cardBorder }}>
        {ITEMS.map((item, i) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.lg,
              backgroundColor: pressed ? t.cardRaised : t.card,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: t.cardBorder,
            })}
          >
            <Ionicons name={item.icon} size={20} color={i === 0 ? t.text : t.primary} />
            <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 16, color: t.text }}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={t.textFaint} />
          </Pressable>
        ))}
      </View>
      <Txt variant="small" style={{ color: t.textFaint }}>
        {config.help.disclaimer}
      </Txt>
    </Screen>
  );
}
