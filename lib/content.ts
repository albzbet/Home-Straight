import raw from '@/content/program.json';

// Lesson content for the 6-week program (content/program.json). A psychologist edits that file, not the code.

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

export const weeks: Week[] = raw.weeks;
export const lessons: Lesson[] = raw.days as Lesson[];

export function lesson(day: number): Lesson | undefined {
  return lessons.find((l) => l.day === day);
}
