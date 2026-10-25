import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Field, Loading, Screen, Txt } from '@/components/ui';
import { pickAndUpload, useIsAdmin } from '@/lib/admin';
import { space } from '@/lib/theme';

// Wraps every admin screen: only admins get past it. (The database checks too; this just keeps everyone else out of the way.)
export function AdminScreen({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const admin = useIsAdmin();
  if (admin === null) return <Loading />;
  if (!admin)
    return (
      <Screen help={false} sos={false}>
        <Txt variant="title">Admins only</Txt>
        <Txt variant="muted">Sign in with an admin account to use this area.</Txt>
        <Button label="Back" kind="secondary" onPress={() => router.replace('/')} />
      </Screen>
    );
  return (
    <Screen help={false} sos={false} footer={footer}>
      <Txt variant="title">{title}</Txt>
      {children}
    </Screen>
  );
}

// A web address for a video or audio file, with an upload button that fills it in.
export function MediaField({
  label,
  url,
  onChange,
  folder,
  kind,
}: {
  label: string;
  url: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  kind: 'audio' | 'video';
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <View style={{ gap: space.sm }}>
      <Field
        label={label}
        value={url ?? ''}
        onChangeText={(v) => onChange(v.trim() || null)}
        placeholder="No file yet (the script is shown instead)"
        autoCapitalize="none"
      />
      <Button
        label={`Upload ${kind === 'audio' ? 'an audio' : 'a video'} file`}
        kind="secondary"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setProblem(null);
          try {
            const uploaded = await pickAndUpload(folder, kind);
            if (uploaded) onChange(uploaded);
          } catch (e) {
            setProblem(`Upload didn't work: ${(e as Error).message}`);
          } finally {
            setBusy(false);
          }
        }}
      />
      {problem ? <Txt variant="small">{problem}</Txt> : null}
    </View>
  );
}

// Save button with a "Saved" / error line, for the bottom of each editor.
export function useSaver(save: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const footer = (
    <>
      {note ? <Txt variant="small">{note}</Txt> : null}
      <Button
        label="Save"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setNote(null);
          try {
            await save();
            setNote('Saved. Everyone gets it next time they open the app.');
          } catch (e) {
            setNote(`That didn't save: ${(e as Error).message}`);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
  return footer;
}
