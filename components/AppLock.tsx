import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelpServices } from '@/components/Help';
import { Button, Txt } from '@/components/ui';
import { checkPin, lockMode, lockSupported, turnLockOff, unlockWithDevice, type LockMode } from '@/lib/appLock';
import { signOut } from '@/lib/auth';
import { isPin, pinWaitSeconds, shouldRelock } from '@/lib/lockRules';
import { useStore } from '@/lib/store';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// The optional app lock. When it's on, the app asks for Face ID / fingerprint or the app's PIN when it opens and after more
// than 30 seconds away, and covers the screen while it's in the background (so the app switcher shows nothing). "Get help
// now" works while locked. The lock screen never mentions gambling.

type LockState = { mode: LockMode; refresh: () => Promise<void> };
const LockContext = createContext<LockState>({ mode: 'off', refresh: async () => {} });
export const useAppLock = () => useContext(LockContext);

export function AppLockGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LockMode | null>(lockSupported ? null : 'off');
  const [locked, setLocked] = useState(false);
  const [covered, setCovered] = useState(false);
  const leftAt = useRef<number | null>(null);

  // Settings changes the lock without locking the app there and then.
  const refresh = useCallback(async () => setMode(await lockMode()), []);
  // Opening the app: locked from the start if the lock is on.
  useEffect(() => {
    lockMode().then((m) => {
      setMode(m);
      setLocked(m !== 'off');
    });
  }, []);

  useEffect(() => {
    if (!lockSupported) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') leftAt.current = Date.now();
      if (s === 'active') {
        if (shouldRelock(leftAt.current, Date.now())) setLocked(true);
        leftAt.current = null;
        setCovered(false);
      } else setCovered(true);
    });
    return () => sub.remove();
  }, []);

  const showLock = mode !== null && mode !== 'off' && locked;
  return (
    <LockContext.Provider value={{ mode: mode ?? 'off', refresh }}>
      {children}
      {mode === null || (mode !== 'off' && covered) ? <Cover /> : null}
      {showLock ? <LockScreen mode={mode} onUnlock={() => setLocked(false)} onReset={refresh} /> : null}
    </LockContext.Provider>
  );
}

// A plain screen over the app while it's in the background or the lock is loading.
function Cover() {
  const t = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}>
      <Image source={require('@/assets/icon.png')} style={{ width: 72, height: 72, borderRadius: 18 }} accessibilityIgnoresInvertColors />
    </View>
  );
}

function LockScreen({ mode, onUnlock, onReset }: { mode: LockMode; onUnlock: () => void; onReset: () => Promise<void> }) {
  const t = useTheme();
  const { signedIn, deleteMyData } = useStore();
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [forgot, setForgot] = useState(false);

  const tryDevice = useCallback(async () => {
    if (await unlockWithDevice()) onUnlock();
  }, [onUnlock]);
  useEffect(() => {
    if (mode === 'device') tryDevice();
  }, [mode, tryDevice]);

  const press = async (key: string) => {
    if (Date.now() < waitUntil) return;
    const next = key === '⌫' ? pin.slice(0, -1) : (pin + key).slice(0, 4);
    setPin(next);
    setMessage(null);
    if (!isPin(next)) return;
    if (await checkPin(next)) return onUnlock();
    const count = wrong + 1;
    const wait = pinWaitSeconds(count);
    setWrong(count);
    setPin('');
    if (wait) setWaitUntil(Date.now() + wait * 1000);
    setMessage(
      wait ? `That's not it. Try again in ${wait < 60 ? `${wait} seconds` : `${wait / 60} minutes`}.` : "That's not it. Try again.",
    );
  };

  // Forgot the PIN: the lock comes off, but only after this phone is cleared (signed out, or a guest's progress wiped), so the
  // lock can't be skipped to read someone's answers. Signed-in members get everything back by signing in again.
  const reset = async () => {
    if (signedIn) await signOut();
    else await deleteMyData();
    await turnLockOff();
    await onReset();
    onUnlock();
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: space.xl, gap: space.lg, maxWidth: 480, width: '100%', alignSelf: 'center' }}
      >
        {help ? (
          <>
            <HelpServices />
            <Button label="Back" kind="secondary" onPress={() => setHelp(false)} />
          </>
        ) : forgot ? (
          <>
            <Txt variant="title">Forgot your PIN?</Txt>
            <Txt variant="muted">
              {signedIn
                ? "We'll sign you out and turn the lock off. Sign in again the same way as before and everything will be there."
                : "Your progress is only on this phone, so to keep it private we'll clear it and turn the lock off. You can start again any time."}
            </Txt>
            <Button label={signedIn ? 'Sign out and turn the lock off' : 'Clear and turn the lock off'} kind="secondary" onPress={reset} />
            <Button label="Back" kind="ghost" onPress={() => setForgot(false)} />
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: space.md, marginTop: space.xxl }}>
              <Image
                source={require('@/assets/icon.png')}
                style={{ width: 64, height: 64, borderRadius: 16 }}
                accessibilityIgnoresInvertColors
              />
              <Txt variant="title">Welcome back</Txt>
            </View>
            {mode === 'device' ? (
              <Button label="Unlock" onPress={tryDevice} />
            ) : (
              <>
                <Txt variant="muted" style={{ textAlign: 'center' }}>
                  Enter your PIN
                </Txt>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg }}
                  accessibilityLabel={`${pin.length} of 4 digits entered`}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: t.action,
                        backgroundColor: i < pin.length ? t.action : 'transparent',
                      }}
                    />
                  ))}
                </View>
                {message ? (
                  <Txt variant="small" style={{ textAlign: 'center' }}>
                    {message}
                  </Txt>
                ) : null}
                <PinPad onPress={press} />
                <Button label="Forgot your PIN?" kind="ghost" onPress={() => setForgot(true)} />
              </>
            )}
            <View style={{ flex: 1 }} />
            <Button label="Get help now" kind="help" onPress={() => setHelp(true)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 1-9, 0 and delete, big enough to tap without looking twice.
export function PinPad({ onPress }: { onPress: (key: string) => void }) {
  const t = useTheme();
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md, maxWidth: 300, alignSelf: 'center' }}>
      {keys.map((k, i) =>
        k ? (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? 'Delete' : k}
            onPress={() => onPress(k)}
            style={({ pressed }) => ({
              width: 76,
              height: 76,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? t.soft : t.surface,
              borderWidth: 1,
              borderColor: t.line,
            })}
          >
            <Text style={{ fontSize: 26, fontFamily: fonts.semibold, color: t.ink }}>{k}</Text>
          </Pressable>
        ) : (
          <View key={i} style={{ width: 76, height: 76 }} />
        ),
      )}
    </View>
  );
}
