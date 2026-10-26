import { config } from './config';
import { timeLabel } from './format';
import { isPaused } from './reminderPlan';
import type { IfThenPlan, Onboarding, ProgramState } from './types';

// If-then plans: "If [a risky moment], then I'll [something else]." Plans this specific are far more likely to happen than a
// general intention. Pure logic, tested in lib/__tests__/plans.test.ts.

const unique = (list: string[]) => [...new Set(list)];

// The "if" choices: their own risky times first, then the other risky times, then a few more common ones.
export function whenOptions(o: Onboarding | null): string[] {
  const all = config.onboarding.riskyTimes.map((r) => r.label);
  return unique([...(o?.riskyTimes ?? []), ...all, ...config.plans.extraWhens]);
}

// The "then" ideas for a risky moment: the ones made for it first, then ones that suit any time.
export function thenSuggestions(when: string): string[] {
  const s = config.plans.suggestions as Record<string, string[]>;
  return unique([...(s[when] ?? []), ...s.anytime!]);
}

// "Payday → I'll move money into savings first thing", for one-line lists (Urge SOS, the game plan).
export function planLine(p: Pick<IfThenPlan, 'when' | 'then'>): string {
  const then = p.then.trim();
  return `${p.when.trim()} → I'll ${then.charAt(0).toLowerCase()}${then.slice(1)}`;
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "Fridays at 4:00pm"
export function remindLabel(r: IfThenPlan['remind']): string | null {
  return r ? `${DAY_NAMES[r.weekday]}s at ${timeLabel(r.time)}` : null;
}

// The weekly heads-ups to have waiting on the phone: none while the program is paused.
export function planNudges(state: ProgramState, today?: string): { weekday: number; hour: number; minute: number }[] {
  if (!state.onboarding || isPaused(state, today)) return [];
  return state.plans
    .filter((p) => p.remind)
    .map((p) => {
      const [hour, minute] = p.remind!.time.split(':').map(Number);
      return { weekday: p.remind!.weekday, hour: hour!, minute: minute! };
    });
}
