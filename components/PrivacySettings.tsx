import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { PinPad, useAppLock } from '@/components/AppLock';
import { Button, Card, Choice, Txt } from '@/components/ui';
import { currentIcon, iconChoices, iconSwitchingAvailable, setIcon, type IconChoice } from '@/lib/appIcon';
import {
  deviceLockAvailable,
  deviceLockName,
  lockSupported,
  setDeviceLock,
  setPinLock,
  turnLockOff,
  unlockWithDevice,
} from '@/lib/appLock';
import { fonts, radius, space, useTheme } from '@/lib/theme';

// Settings > Keep it private: the app lock and a plainer app icon.
export function PrivacySettings() {
  return (
    <>
      {lockSupported ? <LockCard /> : null}
      <IconCard />
    </>
  );
}

function LockCard() {
  const t = useTheme();
  const { mode, refresh } = useAppLock();
  const [deviceOk, setDeviceOk] = useState(false);
  const [deviceName, setDeviceName] = useState("your phone's lock");
  const [pinStep, setPinStep] = useState<'first' | 'again' | null>(null);
  const [first, setFirst] = useState('');
  const [entry, setEntry] = useState('');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    deviceLockAvailable().then(setDeviceOk);
    deviceLockName().then(setDeviceName);
  }, []);

  const chooseDevice = async () => {
    setNote(null);
    if (!(await unlockWithDevice())) return setNote("That didn't go through, so the lock is unchanged.");
    await setDeviceLock();
    await refresh();
    setNote(`Done. The app will ask for ${deviceName} when it opens.`);
  };

  const press = async (key: string) => {
    const next = key === '⌫' ? entry.slice(0, -1) : (entry + key).slice(0, 4);
    setEntry(next);
    if (next.length < 4) return;
    if (pinStep === 'first') {
      setFirst(next);
      setEntry('');
      setPinStep('again');
      return;
    }
    if (next !== first) {
      setEntry('');
      setFirst('');
      setPinStep('first');
      return setNote("Those didn't match. Let's try again.");
    }
    await setPinLock(next);
    await refresh();
    setPinStep(null);
    setEntry('');
    setNote("Done. The app will ask for your PIN when it opens. Keep it somewhere safe: if you forget it, you'll need to sign in again.");
  };

  return (
    <Card>
      <Txt variant="label">App lock</Txt>
      <Txt variant="muted">
        Keep the app private if someone else picks up your phone. It locks when the app opens and after 30 seconds away.
      </Txt>
      {pinStep ? (
        <>
          <Txt variant="h2" style={{ textAlign: 'center' }}>
            {pinStep === 'first' ? 'Choose a 4-digit PIN' : 'Enter it once more'}
          </Txt>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: t.action,
                  backgroundColor: i < entry.length ? t.action : 'transparent',
                }}
              />
            ))}
          </View>
          {note ? <Txt variant="small">{note}</Txt> : null}
          <PinPad onPress={press} />
          <Button label="Cancel" kind="ghost" onPress={() => (setPinStep(null), setEntry(''), setNote(null))} />
        </>
      ) : (
        <>
          <Choice label="Off" selected={mode === 'off'} onPress={async () => (await turnLockOff(), await refresh(), setNote(null))} />
          {deviceOk ? <Choice label={`Use ${deviceName}`} selected={mode === 'device'} onPress={chooseDevice} /> : null}
          <Choice
            label={mode === 'pin' ? 'Use a PIN for this app (tap to change it)' : 'Use a PIN for this app'}
            selected={mode === 'pin'}
            onPress={() => (setPinStep('first'), setNote(null))}
          />
          {note ? <Txt variant="small">{note}</Txt> : null}
        </>
      )}
    </Card>
  );
}

function IconCard() {
  const t = useTheme();
  const available = iconSwitchingAvailable();
  const [chosen, setChosen] = useState<IconChoice['id']>(() => currentIcon());
  const [note, setNote] = useState<string | null>(null);

  const choose = async (id: IconChoice['id']) => {
    if (!available) return setNote('Changing the icon works in the installed app (not in Expo Go or a web browser).');
    try {
      await setIcon(id);
      setChosen(id);
      setNote('Done. It can take a moment to change on your home screen.');
    } catch {
      setNote("The icon couldn't be changed on this phone.");
    }
  };

  return (
    <Card>
      <Txt variant="label">App icon</Txt>
      <Txt variant="muted">None of these say anything about what the app is for. Pick the one you're most comfortable with.</Txt>
      <View style={{ flexDirection: 'row', gap: space.md, justifyContent: 'space-between' }}>
        {iconChoices.map((c) => (
          <Pressable
            key={c.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: chosen === c.id }}
            accessibilityLabel={`${c.label} icon`}
            onPress={() => choose(c.id)}
            style={{ alignItems: 'center', gap: space.xs, flex: 1 }}
          >
            <View
              style={{ padding: 3, borderRadius: radius.md + 4, borderWidth: 2, borderColor: chosen === c.id ? t.action : 'transparent' }}
            >
              <Image source={c.image} style={{ width: 64, height: 64, borderRadius: radius.md }} accessibilityIgnoresInvertColors />
            </View>
            <Text style={{ color: t.ink, fontFamily: chosen === c.id ? fonts.bold : fonts.medium }}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      {note ? <Txt variant="small">{note}</Txt> : null}
    </Card>
  );
}
