import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import episodesRaw from '@/content/episodes.json';
import meditationsRaw from '@/content/meditations.json';
import raw from '@/content/program.json';
import { setSafety, type SafetyContent } from './safety';
import { supabase } from './supabase';

// Lesson content for the 8-week program, the meditations, the Bookie Tricks Exposed episodes and the crisis words.
// The app carries a built-in copy (content/*.json, config/safety.json). Once an admin edits something in the admin area it's
// saved in the database (public.content) and wins over the built-in copy. The last copy fetched is kept on the phone, so
// edits show even offline.

export type Media = { url: string | null; script: string };
export type LessonAudio = Media & { kind: string; minutes: number; title: string };

export type Lesson = {
  day: number;
  week: number;
  title: string;
  reviewStatus: string;
  video: Media;
  audio: LessonAudio;
  busyAudio: Media & { minutes: number };
  action: { prompt: string; options: string[] };
  teaser: string;
};

export type Week = { week: number; theme: string; summary: string };

export type Meditation = { id: string; title: string; minutes: number; theme: string; summary: string; url: string | null; script: string };

export type Episode = {
  id: string;
  number: number;
  title: string;
  duration: string; // as shown in the list, e.g. "8:24"
  summary: string;
  points: string[];
  video: Media;
};

export type Content = { weeks: Week[]; lessons: Lesson[]; meditations: Meditation[]; episodes: Episode[] };

export const builtIn: Content = {
  weeks: raw.weeks,
  lessons: raw.days as Lesson[],
  meditations: meditationsRaw.meditations,
  episodes: episodesRaw.episodes,
};

let current: Content = builtIn;
const listeners = new Set<() => void>();
const CACHE_KEY = 'hs:content';

// Database rows ({ 'lesson:3': {...}, weeks: [...], ... }) laid over the built-in copy.
function apply(remote: Record<string, unknown>) {
  current = {
    weeks: Array.isArray(remote.weeks) ? (remote.weeks as Week[]) : builtIn.weeks,
    lessons: builtIn.lessons.map((l) => ({ ...l, ...((remote[`lesson:${l.day}`] as Partial<Lesson>) ?? {}), day: l.day, week: l.week })),
    meditations: Array.isArray(remote.meditations) ? (remote.meditations as Meditation[]) : builtIn.meditations,
    episodes: (Array.isArray(remote.episodes) ? (remote.episodes as Episode[]) : builtIn.episodes)
      .slice()
      .sort((a, b) => a.number - b.number),
  };
  setSafety((remote.safety as SafetyContent) ?? null);
  listeners.forEach((l) => l());
}

// Called once when the app starts: the saved copy straight away, then the latest from the database.
export async function loadContent() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) apply(JSON.parse(cached));
  } catch {}
  if (!supabase) return;
  const { data, error } = await supabase.rpc('hs_content');
  if (error || !data) return;
  apply(data as Record<string, unknown>);
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
}

// After an admin saves, so the change shows straight away.
export const refreshContent = loadContent;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// The current content, re-rendering when it changes.
export function useContent() {
  const c = useSyncExternalStore(subscribe, () => current);
  return {
    ...c,
    lesson: (day: number) => c.lessons.find((l) => l.day === day),
    week: (n: number) => c.weeks.find((w) => w.week === n),
    // A different meditation suggested each day, the same all day.
    meditationOfTheDay: (date: string) => c.meditations[date.split('-').reduce((a, b) => a + Number(b), 0) % c.meditations.length]!,
  };
}
