import { useRef, useState } from 'react';
import { Linking, Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Txt } from '@/components/ui';
import { config, type HelpService } from '@/lib/config';
import { crisisMessage, mentionsCrisis } from '@/lib/safety';
import { space, useTheme } from '@/lib/theme';

// "Get help now": the button on every screen, the list of services, and the crisis message.

const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {});
const open = (url: string) => Linking.openURL(url).catch(() => {});

// Each service with its number shown in full (so it can be read out or typed) and one-tap buttons.
export function HelpServices({ order }: { order?: string[] }) {
  const services = (config.help.services as HelpService[]).slice().sort((a, b) => (order ? order.indexOf(a.id) - order.indexOf(b.id) : 0));
  return (
    <View style={{ gap: space.md }}>
      {services.map((s) => (
        <Card key={s.id}>
          <Txt variant="h2">{s.name}</Txt>
          <Txt variant="muted">{s.detail}</Txt>
          <Txt variant="title">{s.phone}</Txt>
          <Button label={`Call ${s.phone}`} kind={s.id === 'emergency' ? 'help' : 'primary'} onPress={() => call(s.phone)} />
          {s.web ? (
            <Button
              label={s.id === 'gho' ? 'Live chat on their website' : 'Visit their website'}
              kind="secondary"
              onPress={() => open(s.web!)}
            />
          ) : null}
        </Card>
      ))}
    </View>
  );
}

// The caring message. Nothing else can be done until it's acknowledged.
export function CrisisSheet({ visible, onAcknowledge }: { visible: boolean; onAcknowledge: () => void }) {
  const t = useTheme();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => {}} presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <Txt variant="title">{crisisMessage.title}</Txt>
          <Txt>{crisisMessage.text}</Txt>
          <HelpServices order={['lifeline', 'gho', 'emergency']} />
          <Button label={crisisMessage.acknowledge} kind="secondary" onPress={onAcknowledge} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Wrap "Next" / "Finish": if what they wrote mentions suicide or self-harm, show the caring message first and only carry
// on once it's acknowledged. The same words don't trigger it twice in a row.
export function useCrisisGate() {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const acknowledged = useRef(new Set<string>());

  const check = (texts: string[], go: () => void) => {
    const fresh = texts.filter((x) => x.trim() && !acknowledged.current.has(x.trim()));
    if (!mentionsCrisis(...fresh)) return go();
    fresh.forEach((x) => acknowledged.current.add(x.trim()));
    setPending(() => go);
  };

  const sheet = (
    <CrisisSheet
      visible={!!pending}
      onAcknowledge={() => {
        const go = pending;
        setPending(null);
        go?.();
      }}
    />
  );
  return { check, sheet };
}
