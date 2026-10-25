import { router } from 'expo-router';
import { Card, Txt, Button } from '@/components/ui';
import { refundSummary } from '@/lib/legal';

// The refund promise in a few words, with a link to the full policy. Shown wherever someone could pay (step 9) and in Settings.
export function RefundNote() {
  return (
    <Card>
      <Txt variant="label">Refunds</Txt>
      <Txt>{refundSummary}</Txt>
      <Button label="Read the refund policy" kind="ghost" onPress={() => router.push('/refunds')} />
    </Card>
  );
}
