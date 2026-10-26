import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { Button, Card, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { space, useTheme } from '@/lib/theme';

// Opens the BetStop website (betstop.gov.au) in the phone's browser.
export const openBetstop = () => Linking.openURL(config.betstop.url).catch(() => {});

// The BetStop suggestion: for people who've chosen to stop completely, until they've signed up.
export function BetstopCard({ onMore = true }: { onMore?: boolean }) {
  const t = useTheme();
  return (
    <Card style={{ borderColor: t.primary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Ionicons name="shield-checkmark" size={22} color={t.primary} />
        <Txt variant="h2">Block betting with BetStop</Txt>
      </View>
      <Txt>{config.betstop.intro}</Txt>
      <Button label="Go to BetStop" icon="open-outline" onPress={openBetstop} />
      {onMore ? <Button label="How it works" kind="ghost" onPress={() => router.push('/betstop')} /> : null}
    </Card>
  );
}
