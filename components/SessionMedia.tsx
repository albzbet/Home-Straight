import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Photo } from '@/components/Photo';
import { ProgressBar } from '@/components/ui';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// The lesson's video and audio cards (mockup screen 3). Until a file is uploaded (url is null), pressing play shows the
// script to read instead.

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Script({ text, kind }: { text: string; kind: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: space.sm, padding: space.lg, backgroundColor: t.card, borderRadius: radius.md }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1, color: t.textMuted }}>
        {kind.toUpperCase()} COMING SOON. FOR NOW, HAVE A READ
      </Text>
      {text.split('\n\n').map((p, i) => (
        <Text key={i} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: t.text }}>
          {p}
        </Text>
      ))}
    </View>
  );
}

function PlayButton({ size, onPress, playing, label }: { size: number; onPress: () => void; playing?: boolean; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.onPrimary,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name={playing ? 'pause' : 'play'} size={size * 0.42} color={t.bg} style={{ marginLeft: playing ? 0 : size * 0.05 }} />
    </Pressable>
  );
}

export function VideoCard({
  url,
  script,
  poster,
  seconds = 60,
}: {
  url: string | null;
  script: string;
  poster: number | null;
  seconds?: number;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  if (url && open) return <PlayingVideo url={url} />;
  return (
    <View style={{ gap: space.md }}>
      <Photo source={poster} fade="none" style={{ aspectRatio: 16 / 9 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <PlayButton size={64} onPress={() => setOpen((o) => !o)} label={url ? 'Play the video' : 'Read the video script'} />
        </View>
        <View style={{ paddingHorizontal: space.md, paddingBottom: space.md, gap: space.xs }}>
          <ProgressBar at={0} of={1} height={4} />
          <Text style={{ alignSelf: 'flex-end', fontFamily: fonts.medium, fontSize: 12, color: t.text, opacity: 0.8 }}>
            0:00 / {clock(seconds)}
          </Text>
        </View>
      </Photo>
      {!url && open ? <Script text={script} kind="Video" /> : null}
    </View>
  );
}

function PlayingVideo({ url }: { url: string }) {
  const t = useTheme();
  const player = useVideoPlayer(url, (p) => p.play());
  return (
    <View style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: t.slate, aspectRatio: 16 / 9 }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} nativeControls contentFit="cover" />
    </View>
  );
}

export function AudioCard({ url, script, title, minutes }: { url: string | null; script: string; title: string; minutes: number }) {
  if (url) return <PlayingAudio url={url} title={title} minutes={minutes} />;
  return <ScriptAudio script={script} title={title} minutes={minutes} />;
}

function AudioRow({
  title,
  minutes,
  playing,
  time,
  onPress,
}: {
  title: string;
  minutes: number;
  playing: boolean;
  time: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.lg,
        backgroundColor: t.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: t.cardBorder,
        padding: space.lg,
      }}
    >
      <PlayButton size={56} onPress={onPress} playing={playing} label={playing ? 'Pause' : 'Play the audio'} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t.textMuted }}>{minutes} minute guide</Text>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 17, color: t.text }} numberOfLines={2}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name="pulse" size={16} color={t.textMuted} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t.textMuted }}>{time}</Text>
        </View>
      </View>
    </View>
  );
}

function ScriptAudio({ script, title, minutes }: { script: string; title: string; minutes: number }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: space.md }}>
      <AudioRow title={title} minutes={minutes} playing={false} time={`0:00 / ${minutes}:00`} onPress={() => setOpen((o) => !o)} />
      {open ? <Script text={script} kind="Audio" /> : null}
    </View>
  );
}

function PlayingAudio({ url, title, minutes }: { url: string; title: string; minutes: number }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const total = status.duration > 0 ? status.duration : minutes * 60;
  return (
    <View style={{ gap: space.sm }}>
      <AudioRow
        title={title}
        minutes={minutes}
        playing={status.playing}
        time={`${clock(status.currentTime)} / ${clock(total)}`}
        onPress={() => (status.playing ? player.pause() : player.play())}
      />
      <ProgressBar at={status.currentTime} of={total} height={4} />
    </View>
  );
}
