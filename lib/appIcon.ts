import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// Choosing a different, plainer app icon (Settings > App icon). It needs the installed app: Expo Go and the web can't change
// icons, so there the choice is shown but explained instead. The icons themselves are in assets/ (sources in assets/icons/).

export type IconChoice = { id: 'IconLeaf' | 'IconPlain' | null; label: string; image: number };

export const iconChoices: IconChoice[] = [
  { id: null, label: 'Sunrise', image: require('@/assets/icon.png') },
  { id: 'IconLeaf', label: 'Leaf', image: require('@/assets/icon-leaf.png') },
  { id: 'IconPlain', label: 'Plain', image: require('@/assets/icon-plain.png') },
];

type IconsModule = typeof import('expo-alternate-app-icons');

// Loaded only in the installed app; in Expo Go the native part doesn't exist and importing it would crash.
function icons(): IconsModule | null {
  if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded on demand so Expo Go doesn't crash
    const mod = require('expo-alternate-app-icons') as IconsModule;
    return mod.supportsAlternateIcons ? mod : null;
  } catch {
    return null;
  }
}

export const iconSwitchingAvailable = () => icons() !== null;

export function currentIcon(): IconChoice['id'] {
  return (icons()?.getAppIconName() as IconChoice['id']) ?? null;
}

export async function setIcon(id: IconChoice['id']) {
  const mod = icons();
  if (!mod) throw new Error('not available');
  await mod.setAlternateAppIcon(id);
}
