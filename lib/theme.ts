import { useColorScheme } from 'react-native';

// The single source of colour for the app. Calm, warm and plain: no flashing, no casino colours.
const light = {
  bg: '#F7F3EC', // warm sand
  surface: '#FFFFFF',
  ink: '#1F2D2B',
  muted: '#5E6B68',
  line: '#E3DDD2',
  action: '#2F6F62', // deep eucalyptus green
  actionInk: '#FFFFFF',
  soft: '#E4EFEA', // pale green behind chosen chips and cards
  accent: '#C9734D', // warm clay, used sparingly
  help: '#A23B2A', // Get help now
  helpInk: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#121816',
  surface: '#1B2321',
  ink: '#ECE7DE',
  muted: '#9AA7A3',
  line: '#2C3734',
  action: '#6FB3A2',
  actionInk: '#0F1715',
  soft: '#1F2E2A',
  accent: '#E39A76',
  help: '#E0735F',
  helpInk: '#1A0F0C',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
