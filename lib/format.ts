// Small helpers for numbers people type in.

// "$1,250.50" or "120" -> 1250.5 / 120. Empty or nonsense -> null.
export function parseMoney(s: string): number | null {
  const clean = s.replace(/[$,\s]/g, '');
  if (!clean || !/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const n = Number(clean);
  return n <= 1_000_000 ? n : null;
}

export function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-AU')}`;
}

// "07:30" -> "7:30am"
export function timeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h! < 12 ? 'am' : 'pm';
  const hour = h! % 12 === 0 ? 12 : h! % 12;
  return `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
