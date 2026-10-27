import { config } from './config';
import type { Loop, ProgramState } from './types';

// Your loop: the member's own cycle (their CBT formulation). Pure logic, tested in lib/__tests__/loop.test.ts.

export const LOOP_STEPS = ['triggers', 'thoughts', 'feelings', 'where', 'payoffs', 'costs'] as const;
export type LoopStep = (typeof LOOP_STEPS)[number];

// How each link of the loop is named on screen and in the game plan.
export const LOOP_LABELS: Record<LoopStep, { title: string; question: string; line: string }> = {
  triggers: { title: 'Trigger', question: 'What usually sets it off?', line: 'What sets it off' },
  thoughts: { title: 'Thought', question: 'What do you tell yourself just before?', line: 'What I tell myself' },
  feelings: { title: 'Feeling and urge', question: 'How are you feeling when the urge builds?', line: 'How I feel' },
  where: { title: 'What I do', question: 'Where and how does the gambling happen?', line: 'Where it happens' },
  payoffs: { title: 'What I get out of it', question: 'What does it give you, for a while?', line: 'What I get out of it' },
  costs: { title: 'What it costs me', question: 'What does it cost you afterwards?', line: 'What it costs me' },
};

const unique = (list: string[]) => [...new Set(list.map((x) => x.trim()).filter(Boolean))];

// The choices for one step: their own first (marked "yours"), then the usual ones, then anything they've added themselves.
export function loopChoices(step: LoopStep, state: ProgramState, chosen: string[] = []): { options: string[]; yours: Set<string> } {
  const usual = config.loop[step] as string[];
  let yours: string[] = [];
  if (step === 'triggers') {
    // Their risky times from setup, then what they've logged in Urge SOS, most often first.
    const counts = new Map<string, number>();
    for (const t of state.urges.flatMap((u) => u.triggers)) if (t !== 'Not sure') counts.set(t, (counts.get(t) ?? 0) + 1);
    yours = unique([...(state.onboarding?.riskyTimes ?? []), ...[...counts].sort((a, b) => b[1] - a[1]).map(([t]) => t)]);
  }
  return { options: unique([...yours, ...usual, ...chosen]), yours: new Set(yours) };
}

// One line per step, for the game plan and its PDF: "What sets it off: Payday, Live sport".
export function loopLines(loop: Loop | null): string[] {
  if (!loop) return [];
  return [
    ...LOOP_STEPS.filter((s) => loop[s].length).map((s) => `${LOOP_LABELS[s].line}: ${loop[s].join(', ')}`),
    ...(loop.helped.trim() ? [`What's helped before: ${loop.helped.trim()}`] : []),
  ];
}
