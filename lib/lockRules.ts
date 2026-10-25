// When the app lock asks again, and how wrong PINs slow things down. Pure logic, tested in lib/__tests__/lockRules.test.ts.

// Leave the app for longer than this and it locks again (a quick look at a message doesn't).
export const GRACE_SECONDS = 30;

export function shouldRelock(leftAt: number | null, now: number, graceSeconds = GRACE_SECONDS): boolean {
  return leftAt !== null && now - leftAt > graceSeconds * 1000;
}

// After 5 wrong PINs in a row, a short wait that grows: 30 seconds, then 60, then 2 minutes... (capped at 15 minutes).
export function pinWaitSeconds(wrongInARow: number): number {
  if (wrongInARow < 5) return 0;
  return Math.min(15 * 60, 30 * 2 ** (wrongInARow - 5));
}

export const isPin = (s: string) => /^\d{4}$/.test(s);
