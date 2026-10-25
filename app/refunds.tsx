import { Linking } from 'react-native';
import { Button, Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { refundPolicy } from '@/lib/legal';

export default function Refunds() {
  const email = config.support.email;
  return (
    <Screen>
      <Txt variant="title">Refund policy</Txt>
      <Txt>{refundPolicy}</Txt>
      <Txt variant="muted">Our email: {email}</Txt>
      <Button
        label="Email us"
        kind="secondary"
        onPress={() => Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('Refund request')}`).catch(() => {})}
      />
    </Screen>
  );
}
