import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '@/components/Brand';
import { GetHelpButton, SosButton } from '@/components/GetHelpButton';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, shadow, space, useTheme } from '@/lib/theme';

// Shared building blocks for every screen (the homestr8 design system, see design/homestr8-mockup.png).
// Colours, fonts and sizes come from lib/theme.ts only.

// Every screen has Urge SOS and Get help now along the top (turned off only on those two screens themselves).
// tab: a main tab (the tab bar takes care of the bottom edge, and the top shows the app's name with SOS and help).
export function Screen({
  children,
  footer,
  scroll = true,
  help = true,
  sos = true,
  tab = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  help?: boolean;
  sos?: boolean;
  tab?: boolean;
}) {
  const t = useTheme();
  const inner = (
    <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: space.xl, paddingTop: space.md, gap: space.lg }}>
      {tab ? (
        <BrandHeader />
      ) : help || sos ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {sos ? <SosButton /> : <View />}
          {help ? <GetHelpButton /> : <View />}
        </View>
      ) : null}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={tab ? ['top'] : ['top', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
      {footer ? (
        <View
          style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.sm }}
        >
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

type Variant = 'title' | 'h2' | 'body' | 'muted' | 'small' | 'label';

export function Txt({ children, variant = 'body', style }: { children: ReactNode; variant?: Variant; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  const styles: Record<Variant, TextStyle> = {
    // Headings: Bebas Neue, always capitals.
    title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: 0.5, textTransform: 'uppercase', color: t.text },
    h2: { fontFamily: fonts.display, fontSize: 26, lineHeight: 29, letterSpacing: 0.4, textTransform: 'uppercase', color: t.text },
    // Everything else: Inter.
    body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: t.text },
    muted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: t.textMuted },
    small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: t.textMuted },
    label: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: t.textMuted },
  };
  return <Text style={[styles[variant], style]}>{children}</Text>;
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'help';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const t = useTheme();
  const bg = { primary: t.primary, secondary: t.card, ghost: 'transparent', help: t.help }[kind];
  const fg = { primary: t.onPrimary, secondary: t.text, ghost: t.primary, help: t.onHelp }[kind];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderRadius: radius.md,
        borderWidth: kind === 'secondary' ? 1 : 0,
        borderColor: t.cardBorder,
        minHeight: kind === 'ghost' ? 44 : 54,
        paddingVertical: kind === 'ghost' ? 10 : 15,
        paddingHorizontal: space.xl,
        flexDirection: 'row',
        gap: space.sm,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: off ? 0.45 : pressed ? 0.82 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={{ color: fg, fontSize: kind === 'ghost' ? 15 : 17, fontFamily: fonts.semibold }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// A choice people tap: one of several (radio) or many (checkbox).
export function Choice({ label, detail, selected, onPress }: { label: string; detail?: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        borderWidth: 1.5,
        borderColor: selected ? t.primary : t.cardBorder,
        backgroundColor: selected ? t.primarySoft : t.card,
        borderRadius: radius.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
      }}
    >
      <Text style={{ color: t.text, fontSize: 16, fontFamily: selected ? fonts.semibold : fonts.medium }}>{label}</Text>
      {detail ? <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 2, fontFamily: fonts.body }}>{detail}</Text> : null}
    </Pressable>
  );
}

// Small round-cornered pill, for rows of short options (times, numbers).
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minWidth: 44,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: selected ? t.primary : t.cardBorder,
        backgroundColor: selected ? t.primary : t.card,
        borderRadius: radius.pill,
        paddingVertical: 9,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ color: selected ? t.onPrimary : t.text, fontSize: 15, fontFamily: fonts.semibold }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }, style]}>{children}</View>;
}

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Txt variant="muted">{label}</Txt> : null}
      <TextInput
        placeholderTextColor={t.textFaint}
        selectionColor={t.primary}
        {...props}
        style={[
          {
            borderWidth: 1.5,
            borderColor: t.cardBorder,
            backgroundColor: t.card,
            color: t.text,
            borderRadius: radius.md,
            paddingHorizontal: space.lg,
            paddingVertical: 13,
            fontSize: 16,
            fontFamily: fonts.body,
          },
          props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : null,
          props.style,
        ]}
      />
    </View>
  );
}

// A rounded card on the charcoal background. raised: a step lighter (cards inside cards, or to draw the eye).
export function Card({ children, style, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; raised?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: raised ? t.cardRaised : t.card,
          borderRadius: radius.lg,
          padding: space.xl,
          gap: space.md,
          borderWidth: 1,
          borderColor: t.cardBorder,
        },
        raised ? shadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// The main orange call to action. (Button with kind="primary"; named so screens read clearly.)
export function PrimaryButton(props: Omit<Parameters<typeof Button>[0], 'kind'>) {
  return <Button {...props} kind="primary" />;
}

// How far along something is: green by default. at / of, e.g. 12 of 56 sessions.
export function ProgressBar({ at, of, color, height = 8 }: { at: number; of: number; color?: string; height?: number }) {
  const t = useTheme();
  const share = of > 0 ? Math.max(0, Math.min(1, at / of)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: of, now: at }}
      style={{ height, borderRadius: height / 2, backgroundColor: t.track, overflow: 'hidden' }}
    >
      <View
        style={{ width: `${Math.round(share * 100)}%`, height: '100%', borderRadius: height / 2, backgroundColor: color ?? t.success }}
      />
    </View>
  );
}

// A heading above a group of cards, with an optional link on the right ("See all").
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.5, color: t.text, textTransform: 'uppercase' }}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.primary }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// A number that matters (streak, money kept, time back) with an icon and a short label.
export function StatCard({
  icon,
  iconColor,
  value,
  label,
  sub,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  value: string;
  label: string;
  sub?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          minWidth: 96,
          backgroundColor: t.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: t.cardBorder,
          padding: space.md,
          gap: 2,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={22} color={iconColor ?? t.primary} /> : null}
      <Text
        style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: t.text, marginTop: space.xs }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t.textMuted }}>{label}</Text>
      {sub ? <Text style={{ fontFamily: fonts.body, fontSize: 11, color: t.textFaint }}>{sub}</Text> : null}
    </View>
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
      <ActivityIndicator color={t.action} />
    </View>
  );
}
