import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Kelpie } from '@/components/Brand';
import { GetHelpButton, SosButton } from '@/components/GetHelpButton';
import { Photo } from '@/components/Photo';
import { Button, PrimaryButton } from '@/components/ui';
import { config } from '@/lib/config';
import { money } from '@/lib/format';
import { photos } from '@/lib/images';
import { progress } from '@/lib/progress';
import { useStore } from '@/lib/store';
import { fonts, space, useTheme } from '@/lib/theme';

// "More life" (mockup screen 10): a big photo and what it's all about, with their own numbers and why underneath.
// Shown after each week's summary (?next=home or ?next=finish) and from More > What it's all about.
export default function MoreLife() {
  const t = useTheme();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { state } = useStore();
  const o = state.onboarding;
  const p = progress(state);
  // Their note from the Future you exercise if they've done it (else its first answer); otherwise their why.
  const future = state.futureYou?.letter || state.futureYou?.answers.find(Boolean);
  const why = o?.whyText.trim() || o?.whyChoices[0];
  const facts = [
    `${p.gambleFreeDays} gamble-free ${p.gambleFreeDays === 1 ? 'day' : 'days'}`,
    o?.weeklySpend ? `${money(p.moneyKept)} kept` : null,
  ].filter(Boolean);

  const keepGoing = () => {
    if (next === 'finish') router.replace('/finish');
    else if (next === 'home' || !router.canGoBack()) router.replace('/home');
    else router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* The photo fills the top two thirds and fades into the background, so the words sit below the people in it. */}
      <Photo
        source={photos.moreLife}
        fade="bottom"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '68%', borderRadius: 0 }}
        label="Someone and their dog watching the sun go down over the coast"
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: space.xl, paddingTop: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SosButton />
            <GetHelpButton />
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ gap: space.md, paddingBottom: space.lg }}>
            <Kelpie height={56} />
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 62, color: t.text }}>
              {config.moreLife.lines.map((l) => l.toUpperCase()).join('\n')}
            </Text>
            {facts.length ? <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: t.success }}>{facts.join(' · ')}</Text> : null}
            {future ? (
              <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: t.textMuted }}>
                From future you: <Text style={{ color: t.text }}>"{future}"</Text>
              </Text>
            ) : why ? (
              <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: t.textMuted }}>
                Why you started: <Text style={{ color: t.text }}>{why}</Text>
              </Text>
            ) : null}
          </View>
          <PrimaryButton label="Keep going" onPress={keepGoing} />
          <Button
            label={state.futureYou ? 'See future you' : 'Picture future you'}
            kind="ghost"
            onPress={() => router.push('/future-you')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
