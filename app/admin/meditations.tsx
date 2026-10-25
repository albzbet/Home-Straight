import { useState } from 'react';
import { View } from 'react-native';
import { AdminScreen, MediaField, useSaver } from '@/components/Admin';
import { Button, Card, Field, Txt } from '@/components/ui';
import { saveContent } from '@/lib/admin';
import { useContent, type Meditation } from '@/lib/content';
import { space } from '@/lib/theme';

export default function AdminMeditations() {
  const { meditations } = useContent();
  const [list, setList] = useState<Meditation[]>(meditations);
  const footer = useSaver(() => saveContent({ meditations: list }));
  const set = (i: number, patch: Partial<Meditation>) => setList(list.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <AdminScreen title="Meditations" footer={footer}>
      {list.map((m, i) => (
        <Card key={m.id}>
          <Field label="Title" value={m.title} onChangeText={(title) => set(i, { title })} />
          <Field label="One-line description" value={m.summary} onChangeText={(summary) => set(i, { summary })} />
          <Field
            label="Minutes"
            value={String(m.minutes)}
            onChangeText={(v) => set(i, { minutes: Number(v.replace(/\D/g, '')) || 0 })}
            keyboardType="number-pad"
          />
          <MediaField label="Audio file" url={m.url} onChange={(url) => set(i, { url })} folder="meditations" kind="audio" />
          <Field label="Script (shown until there's audio)" value={m.script} onChangeText={(script) => set(i, { script })} multiline />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Remove" kind="ghost" onPress={() => setList(list.filter((_, j) => j !== i))} />
          </View>
        </Card>
      ))}
      <Button
        label="Add a meditation"
        kind="secondary"
        onPress={() =>
          setList([
            ...list,
            { id: `meditation-${Date.now()}`, title: 'New meditation', minutes: 5, theme: '', summary: '', url: null, script: '' },
          ])
        }
      />
      <Txt variant="small">Remember to press Save after adding or removing.</Txt>
    </AdminScreen>
  );
}
