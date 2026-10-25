import { describe, expect, it } from 'vitest';
import { mentionsCrisis } from '@/lib/safety';

describe('mentionsCrisis', () => {
  it('spots phrases whatever the capitals and punctuation', () => {
    expect(mentionsCrisis('Some days I want to die')).toBe(true);
    expect(mentionsCrisis('thinking about SELF-HARM again')).toBe(true);
    expect(mentionsCrisis('I can’t go on like this')).toBe(true);
    expect(mentionsCrisis('honestly, kms')).toBe(true);
  });

  it('matches whole words only', () => {
    expect(mentionsCrisis('Start my diet on Monday')).toBe(false);
    expect(mentionsCrisis('Skills matter at work')).toBe(false);
    expect(mentionsCrisis('Go for a walk instead')).toBe(false);
  });

  it('checks every text given and ignores empty ones', () => {
    expect(mentionsCrisis('', null, undefined, 'fine')).toBe(false);
    expect(mentionsCrisis('fine', 'better off dead')).toBe(true);
  });
});
