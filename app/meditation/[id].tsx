import { Redirect, useLocalSearchParams } from 'expo-router';
import { LessonAudio } from '@/components/Media';
import { Screen, Txt } from '@/components/ui';
import { meditations } from '@/lib/content';

export default function MeditationPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = meditations.find((x) => x.id === id);
  if (!m) return <Redirect href="/meditations" />;
  return (
    <Screen>
      <Txt variant="label">{m.minutes} minutes</Txt>
      <Txt variant="title">{m.title}</Txt>
      <Txt variant="muted">{m.summary}</Txt>
      <LessonAudio url={m.url} script={m.script} />
    </Screen>
  );
}
