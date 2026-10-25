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

// Splits a headline so its last part can be shown in orange: the last sentence if there are two or more
// ("Small choices. | Big freedom."), otherwise the last word ("Welcome: why you're | here").
export function highlightTail(title: string): [string, string] {
  const t = title.trim();
  const sentences = t.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) return [sentences.slice(0, -1).join(' ') + ' ', sentences.at(-1)!];
  const i = t.lastIndexOf(' ');
  return i < 0 ? ['', t] : [t.slice(0, i + 1), t.slice(i + 1)];
}
