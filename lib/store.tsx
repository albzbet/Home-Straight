import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import { localDate } from './program';
import { emptyState, type DayRecord, type Onboarding, type ProgramState, type Questionnaire, type UrgeLog } from './types';

// A member's program data. Before they make an account ("try first") it lives on the phone only.
// Once they sign in it lives in Supabase (written-down answers encrypted there), and the phone copy is moved across and wiped.

const GUEST_KEY = 'hs:guest:v1';
const NICKNAME_KEY = 'hs:pendingNickname'; // chosen on the "save your progress" screen, before the sign-in round trip

type Store = {
  loading: boolean;
  error: string | null;
  signedIn: boolean;
  state: ProgramState;
  reload: () => void;
  confirmAdult: () => Promise<void>;
  saveNickname: (nickname: string) => Promise<void>;
  saveOnboarding: (o: Onboarding) => Promise<void>;
  saveQuestionnaire: (q: Questionnaire) => Promise<void>;
  saveDay: (d: DayRecord) => Promise<void>;
  saveUrge: (u: UrgeLog) => Promise<void>;
  savePlanNotes: (notes: string) => Promise<void>;
  setPause: (days: number | null | false) => Promise<void>; // days, null = until I come back, false = resume now
  deleteMyData: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

async function readGuest(): Promise<ProgramState> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_KEY);
    return raw ? { ...emptyState, ...(JSON.parse(raw) as ProgramState) } : emptyState;
  } catch {
    return emptyState;
  }
}

async function rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('no accounts');
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function setPendingNickname(nickname: string) {
  return AsyncStorage.setItem(NICKNAME_KEY, nickname.trim());
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading, session } = useAuth();
  const signedIn = !!session;
  const [state, setState] = useState<ProgramState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let live = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!signedIn) {
          const guest = await readGuest();
          if (live) setState(guest);
        } else {
          let server = await rpc<ProgramState>('hs_my_state');
          const guest = await readGuest();
          const nickname = await AsyncStorage.getItem(NICKNAME_KEY);
          // Just signed up after trying Day 1: move the phone copy into the account (skipped if the account already has a program).
          if (!server.onboarding && guest.onboarding) {
            await rpc('hs_import_guest', {
              p: { ...guest, nickname: nickname || server.nickname, adultConfirmed: !!guest.adultConfirmedAt },
            });
            server = await rpc<ProgramState>('hs_my_state');
          } else if (nickname && !server.nickname) {
            await rpc('hs_save_member', { p: { nickname } });
            server = { ...server, nickname };
          }
          await AsyncStorage.multiRemove([GUEST_KEY, NICKNAME_KEY]);
          if (live) setState({ ...emptyState, ...server });
        }
      } catch {
        if (live) setError("We couldn't load your program. Check your internet connection and try again.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [authLoading, signedIn, attempt]);

  // Saves go to the account when signed in, otherwise to the phone. The screen only moves on once a save worked.
  const update = useCallback(
    async (change: (s: ProgramState) => ProgramState, server?: () => Promise<unknown>) => {
      if (signedIn && server) {
        await server();
        setState(change);
      } else {
        const next = change(await readGuest());
        await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(next));
        setState(next);
      }
    },
    [signedIn],
  );

  const value: Store = {
    loading: loading || authLoading,
    error,
    signedIn,
    state,
    reload: () => setAttempt((n) => n + 1),
    confirmAdult: () =>
      update(
        (s) => ({ ...s, adultConfirmedAt: s.adultConfirmedAt ?? new Date().toISOString() }),
        () => rpc('hs_save_member', { p: { adultConfirmed: true } }),
      ),
    saveNickname: (nickname) =>
      update(
        (s) => ({ ...s, nickname }),
        () => rpc('hs_save_member', { p: { nickname } }),
      ),
    saveOnboarding: (o) =>
      update(
        (s) => ({ ...s, onboarding: o }),
        () => rpc('hs_save_member', { p: { onboarding: o } }),
      ),
    saveQuestionnaire: (q) =>
      update(
        (s) => ({ ...s, questionnaires: [...s.questionnaires, q] }),
        () => rpc('hs_save_questionnaire', { p: q }),
      ),
    saveDay: (d) =>
      update(
        (s) => ({ ...s, days: [...s.days.filter((x) => x.day !== d.day), d].sort((a, b) => a.day - b.day) }),
        () => rpc('hs_save_day', { p: d }),
      ),
    saveUrge: (u) =>
      update(
        (s) => ({ ...s, urges: [...s.urges, u] }),
        () => rpc('hs_save_urge', { p: u }),
      ),
    savePlanNotes: (planNotes) =>
      update(
        (s) => ({ ...s, planNotes }),
        () => rpc('hs_save_member', { p: { planNotes } }),
      ),
    setPause: (days) => {
      const today = localDate();
      const pause =
        days === false ? null : { since: today, until: days === null ? null : localDate(new Date(Date.now() + days * 86_400_000)) };
      return update(
        (s) => ({ ...s, pause }),
        () => rpc('hs_set_pause', { p: pause }),
      );
    },
    deleteMyData: async () => {
      if (signedIn) {
        await rpc('hs_delete_my_data');
        await supabase?.auth.signOut();
      }
      await AsyncStorage.multiRemove([GUEST_KEY, NICKNAME_KEY]);
      setState(emptyState);
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
