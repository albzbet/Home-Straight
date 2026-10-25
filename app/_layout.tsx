import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const t = useTheme();
  const scheme = useColorScheme();
  const { loading } = useStore();
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

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
        <Stack.Screen name="help" options={{ headerShown: true, title: '', presentation: 'modal' }} />
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
