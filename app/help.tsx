import { HelpServices } from '@/components/Help';
import { Screen, Txt } from '@/components/ui';
import { config } from '@/lib/config';

// Get help now: free, confidential support, any time.
export default function Help() {
  return (
    <Screen help={false} sos={false}>
      <Txt variant="title">Get help now</Txt>
      <Txt variant="muted">
        Free, confidential and there 24/7. You don't need to be in crisis to call. Talking to someone about gambling, money or how you're
        feeling is always okay.
      </Txt>
      <HelpServices />
      <Txt variant="small">{config.help.disclaimer}</Txt>
    </Screen>
  );
}
