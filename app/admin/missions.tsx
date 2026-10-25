import { useState } from 'react';
import { AdminScreen, useSaver } from '@/components/Admin';
import { Button, Card, Field, Txt } from '@/components/ui';
import { saveContent } from '@/lib/admin';
import { useContent, type Mission } from '@/lib/content';

// Weekly missions: one a week, in this order, back to the start after the last. Saved together.
export default function AdminMissions() {
  const { missions } = useContent();
  const [list, setList] = useState<Mission[]>(missions);
  const footer = useSaver(() =>
    saveContent({ missions: list.map((m) => ({ ...m, ideas: m.ideas.map((x) => x.trim()).filter(Boolean) })) }),
  );
  const set = (i: number, patch: Partial<Mission>) => setList(list.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const move = (i: number, by: number) => {
    const next = list.slice();
    [next[i], next[i + by]] = [next[i + by], next[i]];
    setList(next);
  };

  return (
    <AdminScreen title="Weekly missions" footer={footer}>
      <Txt variant="muted">One mission a week, in this order, starting from the week each member starts the program.</Txt>
      {list.map((m, i) => (
        <Card key={m.id}>
          <Txt variant="label">Week {i + 1}</Txt>
          <Field label="Title" value={m.title} onChangeText={(title) => set(i, { title })} />
          <Field label="What it's about" value={m.body} onChangeText={(body) => set(i, { body })} multiline />
          <Field label="Ideas (one per line)" value={m.ideas.join('\n')} onChangeText={(v) => set(i, { ideas: v.split('\n') })} multiline />
          {i > 0 ? <Button label="Move up" kind="ghost" onPress={() => move(i, -1)} /> : null}
          {i < list.length - 1 ? <Button label="Move down" kind="ghost" onPress={() => move(i, 1)} /> : null}
          {list.length > 1 ? (
            <Button label="Remove this mission" kind="ghost" onPress={() => setList(list.filter((_, j) => j !== i))} />
          ) : null}
        </Card>
      ))}
      <Button
        label="Add a mission"
        kind="secondary"
        onPress={() => setList([...list, { id: `mission-${Date.now()}`, title: 'New mission', body: '', ideas: [] }])}
      />
      <Txt variant="small">Remember to press Save after changing the order, adding or removing. Blank idea lines are left out.</Txt>
    </AdminScreen>
  );
}
