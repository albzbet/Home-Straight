import { Screen, Txt } from '@/components/ui';
import { privacyPolicy } from '@/lib/legal';

export default function Privacy() {
  return (
    <Screen>
      <Txt>{privacyPolicy}</Txt>
    </Screen>
  );
}
