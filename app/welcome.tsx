import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Kelpie } from '@/components/Brand';
import { GetHelpButton } from '@/components/GetHelpButton';
import { Button, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { TOTAL_WEEKS } from '@/lib/program';
import { useStore } from '@/lib/store';
import { accountsAvailable } from '@/lib/supabase';
import { fonts, space, useTheme } from '@/lib/theme';

// First screen (owner's layout, Oct 2026): the name and "LESS NOISE. MORE LIFE." on dark at the top, the photo in the
// middle, Get started at the bottom. The 18+ tick and Get help now stay, as the rules require.
export default function Welcome() {
  const t = useTheme();
  const { confirmAdult } = useStore();
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      await confirmAdult();
      router.replace('/onboarding');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.hero }}>
      {/* The photo, faded into the dark above and below it. */}
      <Image
        source={require('@/assets/images/onboarding.jpg')}
        style={{ position: 'absolute', left: 0, right: 0, top: '30%', bottom: '22%' }}
        contentFit="cover"
        contentPosition={{ left: '50%', top: '64%' }}
        accessibilityLabel="A man and his dog watching the sun rise over the coast"
      />
      <LinearGradient colors={[t.hero, 'transparent']} style={{ position: 'absolute', left: 0, right: 0, top: '30%', height: '16%' }} />
      <LinearGradient
        colors={['transparent', t.hero]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: '22%', height: '18%' }}
        pointerEvents="none"
      />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%', backgroundColor: t.hero }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: space.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: space.md }}>
            <GetHelpButton />
          </View>

          <View style={{ alignItems: 'center', gap: space.sm, marginTop: space.xl }}>
            <Kelpie height={110} />
            <Text
              accessibilityRole="header"
              style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 66, letterSpacing: 1, color: t.text }}
            >
              HOMESTR<Text style={{ color: t.primary }}>8</Text>
            </Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, letterSpacing: 2.5, color: t.text }}>LESS NOISE. MORE LIFE.</Text>
            <Txt variant="muted" style={{ textAlign: 'center', marginTop: space.xs }}>
              An {TOTAL_WEEKS}-week morning program to help you quit, cut back or take a break from gambling.
            </Txt>
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ gap: space.sm, paddingBottom: space.md }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: adult }}
              onPress={() => setAdult((a) => !a)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.sm }}
            >
              <Ionicons name={adult ? 'checkbox' : 'square-outline'} size={24} color={adult ? t.primary : t.text} />
              <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: t.text }}>I'm 18 or older</Text>
            </Pressable>
            <Button label="Get started" kind="light" icon="arrow-forward" onPress={start} disabled={!adult} loading={busy} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: t.text, textAlign: 'center' }}>Your pace. Your call.</Text>
            {accountsAvailable ? <Button label="I already have an account" kind="ghost" onPress={() => router.push('/sign-in')} /> : null}
            <Txt variant="small" style={{ textAlign: 'center', color: t.textFaint }}>
              {config.help.disclaimer}
            </Txt>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
