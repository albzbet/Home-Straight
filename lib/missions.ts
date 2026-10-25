import type { Mission } from './content';
import { localDate } from './program';
import { periodStart, startOfProgram } from './progress';
import type { ProgramState } from './types';

// Weekly missions: one real-life challenge a week, in the order of the list, starting with the first in the week the
// program started (weeks start Monday), and back to the start after the last one. Pure logic, tested in
// lib/__tests__/missions.test.ts.

// The Monday of the week a date falls in.
export const mondayOf = (date: string) => periodStart('week', date, '0000-01-01');

const weeksBetween = (a: string, b: string) =>
  Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / (7 * 86_400_000));

export type ThisWeek = { mission: Mission; weekOf: string; done: boolean };

export function missionOfTheWeek(missions: Mission[], state: ProgramState, today: string = localDate()): ThisWeek | null {
  if (!missions.length) return null;
  const week = mondayOf(today);
  const n = Math.max(0, weeksBetween(mondayOf(startOfProgram(state, today)), week));
  const mission = missions[n % missions.length];
  return { mission, weekOf: week, done: isDone(state, mission.id, week) };
}

export const isDone = (state: ProgramState, missionId: string, week: string) =>
  state.missions.some((m) => m.missionId === missionId && m.weekOf === week);

export const timesDone = (state: ProgramState, missionId: string) => state.missions.filter((m) => m.missionId === missionId).length;
