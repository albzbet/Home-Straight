import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Where sign-in links and Apple/Google send people back to: this app.
export const authRedirectUrl = () =>
  Platform.OS === 'web' ? `${window.location.origin}/auth-callback` : Linking.createURL('auth-callback');

// Sign-in links come back with tokens in the address (#access_token=... or ?code=...).
export async function handleAuthUrl(url: string | null) {
  if (!supabase || !url || !(url.includes('access_token=') || /[?&]code=/.test(url))) return;
  const hash = url.includes('#') ? url.split('#')[1]! : '';
  const query = url.includes('?') ? url.split('?')[1]!.split('#')[0]! : '';
  const params = new URLSearchParams(hash || query);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  const code = new URLSearchParams(query).get('code');
  if (access_token && refresh_token) await supabase.auth.setSession({ access_token, refresh_token });
  else if (code) await supabase.auth.exchangeCodeForSession(code);
}

// Apple or Google sign-in in a browser sheet. Returns an error message, or null when signed in or cancelled.
export async function signInWithProvider(provider: 'apple' | 'google'): Promise<string | null> {
  if (!supabase) return "Accounts aren't switched on yet.";
  const name = provider === 'apple' ? 'Apple' : 'Google';
  const redirectTo = authRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
  });
  if (error) return `Couldn't start ${name} sign-in. Try again or use email.`;
  if (Platform.OS === 'web') return null; // the page goes to the provider and comes back to /auth-callback
  if (!data?.url) return `Couldn't start ${name} sign-in. Try again or use email.`;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null; // closed by the person
  await handleAuthUrl(result.url);
  const { data: s } = await supabase.auth.getSession();
  return s.session ? null : `${name} sign-in didn't finish. Try again or use email.`;
}

// Email: Supabase sends a sign-in link (and a 6-digit code, if the email template includes it).
export async function sendEmailLink(email: string): Promise<string | null> {
  if (!supabase) return "Accounts aren't switched on yet.";
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: authRedirectUrl() } });
  return error ? "Couldn't send the email. Check the address and try again in a minute." : null;
}

export async function verifyEmailCode(email: string, code: string): Promise<string | null> {
  if (!supabase) return "Accounts aren't switched on yet.";
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
  return error ? "That code didn't work. Check it, or ask for a new email." : null;
}

export async function signOut() {
  await supabase?.auth.signOut();
}

type AuthState = { loading: boolean; session: Session | null };
const AuthContext = createContext<AuthState>({ loading: true, session: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    if (Platform.OS === 'web') handleAuthUrl(window.location.href);
    else Linking.getInitialURL().then(handleAuthUrl);
    const linkSub = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));
    return () => {
      sub.subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  return <AuthContext.Provider value={{ loading, session }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
