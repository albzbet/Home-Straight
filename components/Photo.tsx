import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, useTheme } from '@/lib/theme';

// One of the owner's photos, with a dark fade so text on top stays readable. No photo yet: a plain dark space.
export function Photo({
  source,
  style,
  children,
  fade = 'left',
  label,
}: {
  source: number | null;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  fade?: 'left' | 'bottom' | 'none';
  label?: string;
}) {
  const t = useTheme();
  return (
    <View style={[{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: t.slate }, style]}>
      {source ? (
        <Image source={source} style={{ position: 'absolute', inset: 0 }} contentFit="cover" accessibilityLabel={label} />
      ) : (
        <LinearGradient
          colors={[t.cardRaised, t.bg]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}
      {fade !== 'none' ? (
        <LinearGradient
          colors={[t.bg, 'transparent']}
          start={fade === 'left' ? { x: 0, y: 0.5 } : { x: 0.5, y: 1 }}
          end={fade === 'left' ? { x: 0.85, y: 0.5 } : { x: 0.5, y: 0.2 }}
          style={{ position: 'absolute', inset: 0 }}
        />
      ) : null}
      {children}
    </View>
  );
}
