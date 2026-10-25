import { Screen, Txt } from '@/components/ui';
import { termsOfUse } from '@/lib/legal';

export default function Terms() {
  return (
    <Screen>
      <Txt>{termsOfUse}</Txt>
    </Screen>
  );
}
