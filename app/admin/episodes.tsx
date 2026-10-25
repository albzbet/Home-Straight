import { useState } from 'react';
import { AdminScreen, MediaField, useSaver } from '@/components/Admin';
import { Button, Card, Field, Txt } from '@/components/ui';
import { saveContent } from '@/lib/admin';
import { useContent, type Episode } from '@/lib/content';

// Bookie Tricks Exposed episodes: titles, lengths, videos (upload) and text. Saved together.
export default function AdminEpisodes() {
  const { episodes } = useContent();
  const [list, setList] = useState<Episode[]>(episodes);
  const footer = useSaver(() =>
    saveContent({ episodes: list.map((e) => ({ ...e, points: e.points.map((p) => p.trim()).filter(Boolean) })) }),
  );
  const set = (i: number, patch: Partial<Episode>) => setList(list.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  return (
    <AdminScreen title="Bookie Tricks Exposed" footer={footer}>
      {list.map((e, i) => (
        <Card key={e.id}>
          <Txt variant="label">Episode {e.number}</Txt>
          <Field label="Title" value={e.title} onChangeText={(title) => set(i, { title })} />
          <Field label="Length shown in the list (e.g. 8:24)" value={e.duration} onChangeText={(duration) => set(i, { duration })} />
          <Field label="One-line summary" value={e.summary} onChangeText={(summary) => set(i, { summary })} multiline />
          <MediaField
            label="Video file"
            url={e.video.url}
            onChange={(url) => set(i, { video: { ...e.video, url } })}
            folder="episodes"
            kind="video"
          />
          <Field
            label="Script (shown until there's a video)"
            value={e.video.script}
            onChangeText={(script) => set(i, { video: { ...e.video, script } })}
            multiline
          />
          <Field
            label="Key points (one per line)"
            value={e.points.join('\n')}
            onChangeText={(v) => set(i, { points: v.split('\n') })}
            multiline
          />
          <Button label="Remove this episode" kind="ghost" onPress={() => setList(list.filter((_, j) => j !== i))} />
        </Card>
      ))}
      <Button
        label="Add an episode"
        kind="secondary"
        onPress={() =>
          setList([
            ...list,
            {
              id: `episode-${Date.now()}`,
              number: Math.max(0, ...list.map((e) => e.number)) + 1,
              title: 'New episode',
              duration: '5:00',
              summary: '',
              points: [],
              video: { url: null, script: '' },
            },
          ])
        }
      />
      <Txt variant="small">Remember to press Save after adding or removing. Blank key-point lines are left out.</Txt>
    </AdminScreen>
  );
}
