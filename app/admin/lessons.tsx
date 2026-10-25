import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { AdminScreen } from '@/components/Admin';
import { Txt } from '@/components/ui';
import { useContent } from '@/lib/content';
import { radius, space, useTheme } from '@/lib/theme';

export default function AdminLessons() {
  const t = useTheme();
  const { lessons } = useContent();
  return (
    <AdminScreen title="Lessons">
      <Txt variant="muted">Tap a day to edit it. "Approved" means a psychologist has checked it.</Txt>
      {lessons.map((l) => (
        <Pressable
          key={l.day}
          accessibilityRole="button"
          onPress={() => router.push(`/admin/lesson/${l.day}`)}
          style={{ borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, borderRadius: radius.md, padding: space.md }}
        >
          <Txt>
            Day {l.day}: {l.title}
          </Txt>
          <Txt variant="small">
            Week {l.week} · {l.reviewStatus === 'approved' ? 'Approved' : 'Not reviewed yet'} · video {l.video.url ? 'uploaded' : 'none'} ·
            audio {l.audio.url ? 'uploaded' : 'none'}
          </Txt>
        </Pressable>
      ))}
    </AdminScreen>
  );
}
