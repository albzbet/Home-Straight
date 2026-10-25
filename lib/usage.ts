import { supabase } from './supabase';

// Anonymous daily counts for the dashboard (public.usage_counts): just "one more today", no user, no device, nothing that
// identifies anyone. Only for things the database wouldn't otherwise know about. Fire and forget.
export type UsageName = 'guest_onboarded' | 'guest_day1' | 'sos_opened';

export function countUsage(name: UsageName) {
  supabase?.rpc('hs_count', { name }).then(
    () => {},
    () => {},
  );
}
