import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppLockGate } from '@/components/AppLock';
import { AuthProvider } from '@/lib/auth';
import { loadContent } from '@/lib/content';
import { useReminderSync } from '@/lib/reminders';
import { StoreProvider, useStore } from '@/lib/store';
import { fonts, useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const t = useTheme();
  const { loading, state } = useStore();
  // Bebas Neue (headings) and Inter (everything else). If they fail to load, the app carries on in the phone's own font.
  const [fontsLoaded, fontError] = useFonts({ BebasNeue_400Regular, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const ready = !loading && (fontsLoaded || !!fontError);
  useReminderSync(state, !loading);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  useEffect(() => {
    loadContent().catch(() => {});
  }, []);

  // The app is dark only, so the navigator's own colours are too.
  const navTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: t.bg, card: t.bg, text: t.ink, border: t.line, primary: t.action },
  };
  if (!ready) return null;
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sos" options={{ presentation: 'modal' }} />
        <Stack.Screen name="help" options={{ headerShown: true, title: '', presentation: 'modal' }} />
        <Stack.Screen name="admin/index" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/dashboard" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/lessons" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/lesson/[day]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/weeks" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/meditations" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/episodes" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/missions" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="episode/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/safety" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="meditations" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="meditation/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="plan" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy policy' }} />
        <Stack.Screen name="terms" options={{ headerShown: true, title: 'Terms of use' }} />
        <Stack.Screen name="refunds" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="hardship" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="missions" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="goal" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="betstop" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="more-life" />
        <Stack.Screen name="buddy" options={{ headerShown: false }} />
        <Stack.Screen name="admin/hardship" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="sign-in" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="save-progress" options={{ headerShown: true, title: '' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <AppLockGate>
            <RootStack />
          </AppLockGate>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
