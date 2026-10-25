import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable, View } from 'react-native';
import { Card, Txt } from '@/components/ui';
import { radius, space, useTheme } from '@/lib/theme';

// Lesson video and audio. Until a file is uploaded (url is null in content/program.json), the script shows as text instead.

export function LessonVideo({ url, script }: { url: string | null; script: string }) {
  if (!url) return <Placeholder kind="Video" script={script} />;
  return <Video url={url} />;
}

function Video({ url }: { url: string }) {
  const t = useTheme();
  const player = useVideoPlayer(url);
  return (
    <View style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: t.surface, aspectRatio: 16 / 9 }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} nativeControls contentFit="contain" />
    </View>
  );
}

export function LessonAudio({ url, script, title }: { url: string | null; script: string; title?: string }) {
  if (!url) return <Placeholder kind="Audio" script={script} />;
  return <Audio url={url} title={title} />;
}

function Audio({ url, title }: { url: string; title?: string }) {
  const t = useTheme();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const mins = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <Card style={{ alignItems: 'center' }}>
      {title ? <Txt variant="h2">{title}</Txt> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause' : 'Play'}
        onPress={() => (status.playing ? player.pause() : player.play())}
        style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: t.action, alignItems: 'center', justifyContent: 'center' }}
      >
        <Txt variant="h2" style={{ color: t.actionInk }}>
          {status.playing ? 'Pause' : 'Play'}
        </Txt>
      </Pressable>
      <View style={{ alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: t.line, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: t.action }} />
      </View>
      <Txt variant="small">
        {mins(status.currentTime)} / {mins(status.duration)}
      </Txt>
    </Card>
  );
}

function Placeholder({ kind, script }: { kind: string; script: string }) {
  const t = useTheme();
  return (
    <Card style={{ backgroundColor: t.soft, borderColor: t.soft }}>
      <Txt variant="label">{kind} coming soon. For now, have a read</Txt>
      <View style={{ gap: space.sm }}>
        {script.split('\n\n').map((p, i) => (
          <Txt key={i}>{p}</Txt>
        ))}
      </View>
    </Card>
  );
}
