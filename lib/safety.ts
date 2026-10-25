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

const phrases = safety.phrases.map(normalise).filter((p) => p.trim());

export function mentionsCrisis(...texts: (string | null | undefined)[]): boolean {
  return texts.some((t) => {
    if (!t) return false;
    const text = normalise(t);
    return phrases.some((p) => text.includes(p));
  });
}

export const crisisMessage = safety.message;
