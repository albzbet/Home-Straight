import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { refreshContent } from './content';
import { useStore } from './store';
import { supabase } from './supabase';

// The admin area: who's an admin, saving content, uploading media, and the dashboard numbers.
// Admins are added by the owner in Supabase (see supabase/migrations/0002_admin.sql). The database checks every save.

export function useIsAdmin(): boolean | null {
  const { signedIn } = useStore();
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!signedIn || !supabase) return;
    supabase.rpc('hs_is_admin').then(({ data }) => setAdmin(data === true));
  }, [signedIn]);
  return signedIn && supabase ? admin : false;
}

// Save one or more pieces of content, e.g. { 'lesson:3': {...} }, then reload so the app shows it straight away.
export async function saveContent(items: Record<string, unknown>) {
  if (!supabase) throw new Error('no database');
  const { error } = await supabase.rpc('hs_admin_save_content', { items });
  if (error) throw new Error(error.message);
  await refreshContent();
}

// Pick an audio or video file and upload it to the public "media" bucket. Returns its web address, or null if cancelled.
export async function pickAndUpload(folder: string, kind: 'audio' | 'video'): Promise<string | null> {
  if (!supabase) throw new Error('no database');
  const res = await DocumentPicker.getDocumentAsync({ type: kind === 'audio' ? 'audio/*' : 'video/*', copyToCacheDirectory: true });
  if (res.canceled) return null;
  const file = res.assets[0]!;
  const ext = (file.name.split('.').pop() || (kind === 'audio' ? 'mp3' : 'mp4')).toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${Date.now()}.${ext}`;
  const body = file.file ?? (await (await fetch(file.uri)).arrayBuffer());
  const { error } = await supabase.storage.from('media').upload(path, body, { contentType: file.mimeType ?? undefined });
  if (error) throw new Error(error.message);
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

export type Stats = {
  members: number;
  tryFirst: { onboarded: number; day1: number };
  funnel: { day1: number; day3: number; day7: number; week3: number; week8: number };
  sos: { opened: number; opened30: number; logged: number; handled: number };
  checkins30: { count: number; mood: number; urge: number } | null;
  questionnaire: { people: number; before?: number; after?: number };
  minGroup: number;
};

export async function fetchStats(): Promise<Stats> {
  if (!supabase) throw new Error('no database');
  const { data, error } = await supabase.rpc('hs_admin_stats');
  if (error) throw new Error(error.message);
  return data as Stats;
}
