// The homestr8 design system: the single source of colour, type, spacing and shape. Matches design/homestr8-mockup.png.
// Dark only, on purpose. Components take every colour from these tokens; never hard-code a colour in a screen.

export const colors = {
  bg: '#0F1114', // charcoal background
  hero: '#0F171F', // the dark space behind the app name on the welcome screen
  primary: '#FF6A2E', // orange: main buttons, highlights, the "8"
  onPrimary: '#FFFFFF',
  text: '#FFFFFF',
  textMuted: '#A7AFBA',
  textFaint: '#6E7782',
  success: '#22C55E', // green: progress bars, "done", money kept
  slate: '#334155', // blue-grey brand colour; cards are built from it
  card: 'rgba(51, 65, 85, 0.38)', // #334155 over the charcoal: the standard card
  cardRaised: 'rgba(51, 65, 85, 0.62)', // a step lighter, for cards on cards and pressed states
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  primarySoft: 'rgba(255, 106, 46, 0.16)', // orange wash behind chosen options
  successSoft: 'rgba(34, 197, 94, 0.16)',
  track: 'rgba(255, 255, 255, 0.12)', // empty part of a progress bar
  sos: '#EF4444', // Urge SOS icon
  calm: '#38BDF8', // "time back" clock
  explore: '#8B5CF6', // Bookie Tricks Exposed tile
  mission: '#F59E0B', // weekly mission tile
  help: '#FFFFFF', // Get help now: white, so it stands apart from the orange buttons
  onHelp: '#0F1114',
  overlay: 'rgba(15, 17, 20, 0.55)', // over photos, so text stays readable
};

// Fonts are loaded in app/_layout.tsx (Google Fonts via expo-google-fonts). Use these names, not fontWeight, with them.
export const fonts = {
  display: 'BebasNeue_400Regular', // headings: always upper case
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 16, pill: 999 };

// A soft drop shadow for cards that sit on photos or need lifting.
export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

// The older token names the existing screens use, mapped onto the new palette.
const legacy = {
  bg: colors.bg,
  surface: colors.card,
  ink: colors.text,
  muted: colors.textMuted,
  line: 'rgba(255, 255, 255, 0.12)',
  action: colors.primary,
  actionInk: colors.onPrimary,
  soft: colors.primarySoft,
  accent: colors.primary,
  help: colors.help,
  helpInk: colors.onHelp,
};

const theme = { ...colors, ...legacy };
export type Theme = typeof theme;

export function useTheme(): Theme {
  return theme;
}
