// The shapes of a member's data. The server (hs_my_state) returns exactly these.

export type Goal = 'quit' | 'cut_back' | 'break';

export type Onboarding = {
  goal: Goal;
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
};

export type ProgramState = {
  nickname: string | null;
  adultConfirmedAt: string | null;
  onboarding: Onboarding | null;
  questionnaires: Questionnaire[];
  days: DayRecord[];
};

export const emptyState: ProgramState = { nickname: null, adultConfirmedAt: null, onboarding: null, questionnaires: [], days: [] };
