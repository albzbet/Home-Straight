import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The optional app lock: Face ID / fingerprint (falling back to the phone's own passcode), or a 4-digit PIN just for this
// app. Settings live in the phone's secure storage (Keychain / Keystore). The PIN itself is never stored, only a salted hash.

export type LockMode = 'off' | 'device' | 'pin';
type Saved = { mode: LockMode; salt?: string; pinHash?: string };

const KEY = 'hs.applock';
export const lockSupported = Platform.OS !== 'web';

const hash = (salt: string, pin: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

async function read(): Promise<Saved> {
  if (!lockSupported) return { mode: 'off' };
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as Saved) : { mode: 'off' };
  } catch {
    return { mode: 'off' };
  }
}

export async function lockMode(): Promise<LockMode> {
  return (await read()).mode;
}

// Can this phone do Face ID, fingerprint or at least its own passcode?
export async function deviceLockAvailable(): Promise<boolean> {
  if (!lockSupported) return false;
  try {
    return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

// "Face ID", "fingerprint" or "your phone's lock", for button labels.
export async function deviceLockName(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (enrolled && types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
      return Platform.OS === 'ios' ? 'Face ID' : 'face unlock';
    if (enrolled && types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  } catch {}
  return "your phone's lock";
}

export async function unlockWithDevice(): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock', cancelLabel: 'Cancel', disableDeviceFallback: false });
    return r.success;
  } catch {
    return false;
  }
}

export async function checkPin(pin: string): Promise<boolean> {
  const s = await read();
  return s.mode === 'pin' && !!s.salt && (await hash(s.salt, pin)) === s.pinHash;
}

export async function setDeviceLock() {
  await SecureStore.setItemAsync(KEY, JSON.stringify({ mode: 'device' } satisfies Saved));
}

export async function setPinLock(pin: string) {
  const salt = toHex(Crypto.getRandomBytes(16));
  await SecureStore.setItemAsync(KEY, JSON.stringify({ mode: 'pin', salt, pinHash: await hash(salt, pin) } satisfies Saved));
}

export async function turnLockOff() {
  if (lockSupported) await SecureStore.deleteItemAsync(KEY);
}
