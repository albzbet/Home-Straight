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
import { GetHelpButton } from '@/components/GetHelpButton';
import { radius, space, useTheme } from '@/lib/theme';

// Shared building blocks for every screen. Colours come from lib/theme.ts only.

// Every screen has "Get help now" in its top corner (help={false} only on the help screen itself).
export function Screen({
  children,
  footer,
  scroll = true,
  help = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  help?: boolean;
}) {
  const t = useTheme();
  const inner = (
    <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: space.xl, paddingTop: space.md, gap: space.lg }}>
      {help ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <GetHelpButton />
        </View>
      ) : null}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
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
    title: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: t.ink },
    h2: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: t.ink },
    body: { fontSize: 16, lineHeight: 24, color: t.ink },
    muted: { fontSize: 15, lineHeight: 22, color: t.muted },
    small: { fontSize: 13, lineHeight: 18, color: t.muted },
    label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: t.muted },
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
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  loading?: boolean;
}) {
  const t = useTheme();
  const bg = { primary: t.action, secondary: t.surface, ghost: 'transparent', help: t.help }[kind];
  const fg = { primary: t.actionInk, secondary: t.ink, ghost: t.action, help: t.helpInk }[kind];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderRadius: radius.pill,
        borderWidth: kind === 'secondary' ? 1 : 0,
        borderColor: t.line,
        paddingVertical: 15,
        paddingHorizontal: space.xl,
        alignItems: 'center',
        opacity: off ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{label}</Text>}
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
        borderColor: selected ? t.action : t.line,
        backgroundColor: selected ? t.soft : t.surface,
        borderRadius: radius.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
      }}
    >
      <Text style={{ color: t.ink, fontSize: 16, fontWeight: selected ? '700' : '500' }}>{label}</Text>
      {detail ? <Text style={{ color: t.muted, fontSize: 14, marginTop: 2 }}>{detail}</Text> : null}
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
        borderColor: selected ? t.action : t.line,
        backgroundColor: selected ? t.action : t.surface,
        borderRadius: radius.pill,
        paddingVertical: 9,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ color: selected ? t.actionInk : t.ink, fontSize: 15, fontWeight: '600' }}>{label}</Text>
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
        placeholderTextColor={t.muted}
        {...props}
        style={[
          {
            borderWidth: 1.5,
            borderColor: t.line,
            backgroundColor: t.surface,
            color: t.ink,
            borderRadius: radius.md,
            paddingHorizontal: space.lg,
            paddingVertical: 13,
            fontSize: 16,
          },
          props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : null,
          props.style,
        ]}
      />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.surface, borderRadius: radius.lg, padding: space.xl, gap: space.md, borderWidth: 1, borderColor: t.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// A thin bar showing how far through a set of steps someone is.
export function StepBar({ at, of }: { at: number; of: number }) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: of, now: at }}
      style={{ height: 6, borderRadius: 3, backgroundColor: t.line, overflow: 'hidden' }}
    >
      <View style={{ width: `${Math.round((at / of) * 100)}%`, height: '100%', backgroundColor: t.action }} />
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
