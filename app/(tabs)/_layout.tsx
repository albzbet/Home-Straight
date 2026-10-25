import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { fonts, useTheme } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

// The bottom tab bar (mockup): Home, Program, Progress, Explore, More. Orange for the tab you're on.
const TABS: { name: string; title: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'home', title: 'Home', icon: 'home-outline', iconOn: 'home' },
  { name: 'program', title: 'Program', icon: 'calendar-outline', iconOn: 'calendar' },
  { name: 'progress', title: 'Progress', icon: 'stats-chart-outline', iconOn: 'stats-chart' },
  { name: 'explore', title: 'Explore', icon: 'compass-outline', iconOn: 'compass' },
  { name: 'more', title: 'More', icon: 'menu-outline', iconOn: 'menu' },
];

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textFaint,
        tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.cardBorder },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? tab.iconOn : tab.icon} color={String(color)} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
