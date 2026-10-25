import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';
import { loadContent } from '@/lib/content';
import { useReminderSync } from '@/lib/reminders';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const t = useTheme();
  const scheme = useColorScheme();
  const { loading, state } = useStore();
  useReminderSync(state, !loading);
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);
  useEffect(() => {
    loadContent().catch(() => {});
  }, []);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: t.bg, card: t.bg, text: t.ink, border: t.line, primary: t.action } };
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="sos" options={{ presentation: 'modal' }} />
        <Stack.Screen name="help" options={{ headerShown: true, title: '', presentation: 'modal' }} />
        <Stack.Screen name="admin/index" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/dashboard" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/lessons" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/lesson/[day]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/weeks" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/meditations" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="admin/safety" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="meditations" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="meditation/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="plan" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="program" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy policy' }} />
        <Stack.Screen name="terms" options={{ headerShown: true, title: 'Terms of use' }} />
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
          <RootStack />
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
