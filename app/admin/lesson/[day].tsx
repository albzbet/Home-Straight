import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AdminScreen, MediaField, useSaver } from '@/components/Admin';
import { Choice, Field, Txt } from '@/components/ui';
import { saveContent } from '@/lib/admin';
import { useContent, type Lesson } from '@/lib/content';

// Edit one day's lesson. Every field a person sees in that session is here.
export default function AdminLesson() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const { lesson } = useContent();
  const original = lesson(Number(day));
  const [l, setL] = useState<Lesson | undefined>(original);
  const [options, setOptions] = useState((original?.action.options ?? []).join('\n'));
  const footer = useSaver(() => {
    const out: Lesson = {
      ...l!,
      action: {
        ...l!.action,
        options: options
          .split('\n')
          .map((o) => o.trim())
          .filter(Boolean),
      },
    };
    return saveContent({ [`lesson:${out.day}`]: out });
  });
  if (!l) return <Redirect href="/admin/lessons" />;
  const folder = `lessons/day-${l.day}`;
  const set = (patch: Partial<Lesson>) => setL({ ...l, ...patch });

  return (
    <AdminScreen title={`Day ${l.day}`} footer={footer}>
      <Field label="Title" value={l.title} onChangeText={(title) => set({ title })} />

      <Txt variant="h2">1. Video (about 60 seconds)</Txt>
      <MediaField
        label="Video file"
        url={l.video.url}
        onChange={(url) => set({ video: { ...l.video, url } })}
        folder={folder}
        kind="video"
      />
      <Field
        label="Script (shown until there's a video)"
        value={l.video.script}
        onChangeText={(script) => set({ video: { ...l.video, script } })}
        multiline
      />

      <Txt variant="h2">2. Guided audio (5 to 7 minutes)</Txt>
      <Field label="Audio title" value={l.audio.title} onChangeText={(title) => set({ audio: { ...l.audio, title } })} />
      <Field
        label="Minutes"
        value={String(l.audio.minutes)}
        onChangeText={(m) => set({ audio: { ...l.audio, minutes: Number(m.replace(/\D/g, '')) || 0 } })}
        keyboardType="number-pad"
      />
      <MediaField
        label="Audio file"
        url={l.audio.url}
        onChange={(url) => set({ audio: { ...l.audio, url } })}
        folder={folder}
        kind="audio"
      />
      <Field label="Script" value={l.audio.script} onChangeText={(script) => set({ audio: { ...l.audio, script } })} multiline />

      <Txt variant="h2">Busy-day audio (about 3 minutes)</Txt>
      <MediaField
        label="Audio file"
        url={l.busyAudio.url}
        onChange={(url) => set({ busyAudio: { ...l.busyAudio, url } })}
        folder={folder}
        kind="audio"
      />
      <Field
        label="Script"
        value={l.busyAudio.script}
        onChangeText={(script) => set({ busyAudio: { ...l.busyAudio, script } })}
        multiline
      />

      <Txt variant="h2">4. One action for today</Txt>
      <Field label="Prompt" value={l.action.prompt} onChangeText={(prompt) => set({ action: { ...l.action, prompt } })} />
      <Field label="Options to pick from (one per line)" value={options} onChangeText={setOptions} multiline />

      <Txt variant="h2">Tomorrow's teaser</Txt>
      <Field label="One line shown at the end" value={l.teaser} onChangeText={(teaser) => set({ teaser })} />

      <Choice
        label="Approved by a psychologist"
        selected={l.reviewStatus === 'approved'}
        onPress={() => set({ reviewStatus: l.reviewStatus === 'approved' ? 'placeholder' : 'approved' })}
      />
    </AdminScreen>
  );
}
