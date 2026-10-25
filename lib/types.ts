// The shapes of a member's data. The server (hs_my_state) returns exactly these.

export type Goal = 'quit' | 'cut_back' | 'break';

export type Onboarding = {
  goal: Goal;
  gamblingTypes: string[]; // pokies, sports betting... the main one first
  whyChoices: string[];
  whyText: string;
  weeklySpend: number | null; // average weekly spend on gambling, in dollars
  savingFor: string; // e.g. "A trip to Bali"
  savingTarget: number | null;
  riskyTimes: string[];
  payday: string;
  habit: string; // "With my morning coffee"
  reminderTime: string; // "07:30"
  buddyEmail: string;
  buddyConsent: boolean;
  completedAt: string | null;
};

export type Questionnaire = { kind: 'baseline' | 'end'; answers: number[]; takenAt: string };

export type DayRecord = {
  day: number;
  localDate: string; // the member's own date when they finished it, YYYY-MM-DD
  completedAt: string;
  busy: boolean; // did the 5-minute version
  mood: number | null; // 1-5
  urge: number | null; // 0-10
  gambled: boolean | null; // yesterday
  amount: number | null;
  action: string;
  slipWhat?: string; // if they gambled: what was going on (bounce-back step)
  slipDifferent?: string; // ...and what they'd do differently
};

// A check-in outside the program's sessions: the daily check-in after the program, or a repeated week.
export type DailyCheckin = {
  localDate: string;
  mood: number | null;
  urge: number | null;
  gambled: boolean | null; // since the last check-in
  amount: number | null;
  action: string;
  slipWhat: string;
  slipDifferent: string;
  note?: string; // the optional "what's on your mind?" note
};

// One use of Urge SOS, logged afterwards.
export type UrgeLog = {
  at: string; // when it started
  seconds: number; // how long they stayed with the timer
  triggers: string[];
  passed: 'yes' | 'easing' | 'gambled';
  helped: string[];
  note: string;
};

// A weekly mission ticked off. weekOf: the Monday of the week it counts for.
export type MissionDone = { missionId: string; weekOf: string; at: string };

export type ProgramState = {
  nickname: string | null;
  adultConfirmedAt: string | null;
  onboarding: Onboarding | null;
  questionnaires: Questionnaire[];
  days: DayRecord[];
  urges: UrgeLog[];
  checkins: DailyCheckin[];
  missions: MissionDone[];
  planNotes: string; // their own notes for the game plan
  pause: Pause | null; // the program is on hold: no reminders, no new sessions nudged
};

export type Pause = { since: string; until: string | null }; // until: YYYY-MM-DD, or null for "until I come back"

export const emptyState: ProgramState = {
  nickname: null,
  adultConfirmedAt: null,
  onboarding: null,
  questionnaires: [],
  days: [],
  urges: [],
  checkins: [],
  missions: [],
  pause: null,
  planNotes: '',
};
