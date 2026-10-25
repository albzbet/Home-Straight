import { useState } from 'react';
import { AdminScreen, useSaver } from '@/components/Admin';
import { Field, Txt } from '@/components/ui';
import { saveContent } from '@/lib/admin';
import { crisisMessage, crisisPhrases } from '@/lib/safety';

// The crisis words and the caring message. A match anywhere someone types stops them until they've read the message.
export default function AdminSafety() {
  const [phrases, setPhrases] = useState(crisisPhrases().join('\n'));
  const [msg, setMsg] = useState(crisisMessage());
  const footer = useSaver(() =>
    saveContent({
      safety: {
        phrases: phrases
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
        message: msg,
      },
    }),
  );
  return (
    <AdminScreen title="Crisis words and message" footer={footer}>
      <Txt variant="muted">
        One word or phrase per line. Matching ignores capitals and punctuation, and only matches whole words, so "die" won't match "diet".
        Have a clinician review this list.
      </Txt>
      <Field
        label="Words and phrases"
        value={phrases}
        onChangeText={setPhrases}
        multiline
        style={{ minHeight: 260 }}
        autoCapitalize="none"
      />
      <Txt variant="h2">The caring message</Txt>
      <Field label="Heading" value={msg.title} onChangeText={(title) => setMsg({ ...msg, title })} />
      <Field label="Message" value={msg.text} onChangeText={(text) => setMsg({ ...msg, text })} multiline />
      <Field label="Button" value={msg.acknowledge} onChangeText={(acknowledge) => setMsg({ ...msg, acknowledge })} />
      <Txt variant="small">Lifeline, Gambling Help Online and 000 are always listed under the message.</Txt>
    </AdminScreen>
  );
}
