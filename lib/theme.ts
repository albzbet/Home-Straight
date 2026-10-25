// The homestr8 design system: the single source of colour, type, spacing and shape. Matches design/homestr8-mockup.png.
// Dark only, on purpose. Components take every colour from these tokens; never hard-code a colour in a screen.

export const colors = {
  bg: '#17191A', // charcoal background
  hero: '#17191A', // the dark space behind the app name on the welcome screen
  primary: '#C57950', // burnt copper: main buttons, highlights, the "8"
  onPrimary: '#FFFFFF',
  text: '#FFFFFF', // timeless white
  textMuted: '#ABA7A2',
  textFaint: '#77736E',
  success: '#399B7A', // progress green: progress bars, "done", money kept
  slate: '#4C4945', // stone: cards are built from it
  card: 'rgba(76, 73, 69, 0.42)', // stone over the charcoal: the standard card
  cardRaised: 'rgba(76, 73, 69, 0.68)', // a step lighter, for cards on cards and pressed states
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  primarySoft: 'rgba(197, 121, 80, 0.18)', // copper wash behind chosen options
  successSoft: 'rgba(57, 155, 122, 0.18)',
  track: 'rgba(255, 255, 255, 0.12)', // empty part of a progress bar
  sos: '#E05A4F', // Urge SOS icon
  calm: '#7FA7C2', // spare accent
  explore: '#C57950', // Bookie Tricks Exposed tile
  mission: '#D9A441', // weekly mission tile
  help: '#FFFFFF', // Get help now and the big white buttons
  onHelp: '#17191A',
  overlay: 'rgba(23, 25, 26, 0.55)', // over photos, so text stays readable
};

// The five mood faces on the check-in, from 1 (struggling) to 5 (great).
export const moodColors = ['#E05A4F', '#E08A4F', '#E8C15A', '#C9C4BD', '#B9B4AD'];

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
