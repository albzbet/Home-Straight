import { router } from 'expo-router';
import { AdminScreen } from '@/components/Admin';
import { Button, Txt } from '@/components/ui';

// The admin area's front page.
export default function AdminHome() {
  return (
    <AdminScreen title="Admin">
      <Txt variant="muted">
        Changes you save here reach everyone the next time they open the app. Anything you haven't changed comes from the copy built into
        the app.
      </Txt>
      <Button label="Dashboard" onPress={() => router.push('/admin/dashboard')} />
      <Button label="Lessons (56 days)" kind="secondary" onPress={() => router.push('/admin/lessons')} />
      <Button label="Week themes" kind="secondary" onPress={() => router.push('/admin/weeks')} />
      <Button label="Meditations" kind="secondary" onPress={() => router.push('/admin/meditations')} />
      <Button label="Bookie Tricks Exposed episodes" kind="secondary" onPress={() => router.push('/admin/episodes')} />
      <Button label="Crisis words and message" kind="secondary" onPress={() => router.push('/admin/safety')} />
      <Button label="Free access requests" kind="secondary" onPress={() => router.push('/admin/hardship')} />
    </AdminScreen>
  );
}
