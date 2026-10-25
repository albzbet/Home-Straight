import safety from '@/config/safety.json';

// Crisis word check (word list in config/safety.json). Runs on the phone, so it works instantly and offline.
// Nothing is stored or sent when it matches: it only shows the caring message.

// Lower case, apostrophes kept, any other punctuation turned into spaces, so "Self-harm!!" still matches "self harm".
const normalise = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .trim()} `;

export type SafetyContent = { phrases: string[]; message: typeof safety.message };

let raw = safety.phrases;
let phrases = raw.map(normalise).filter((p) => p.trim());
let message = safety.message;

export const crisisMessage = () => message;
export const crisisPhrases = () => raw;

// The admin area can replace the word list and message (see lib/content.ts). null goes back to config/safety.json.
export function setSafety(s: SafetyContent | null) {
  const next = s?.phrases?.length ? s : safety;
  raw = next.phrases;
  phrases = raw.map(normalise).filter((p) => p.trim());
  message = { ...safety.message, ...next.message };
}

export function mentionsCrisis(...texts: (string | null | undefined)[]): boolean {
  return texts.some((t) => {
    if (!t) return false;
    const text = normalise(t);
    return phrases.some((p) => text.includes(p));
  });
}
