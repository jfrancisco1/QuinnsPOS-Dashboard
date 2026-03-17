import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'login',
};

function RootLayoutNav() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [token, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-item"
        options={{ presentation: 'modal', title: 'New Item' }}
      />
      <Stack.Screen
        name="new-category"
        options={{ presentation: 'modal', title: 'New Category' }}
      />
<Stack.Screen
        name="edit-item"
        options={{ presentation: 'modal', title: 'Edit Item' }}
      />
      <Stack.Screen
        name="edit-category"
        options={{ presentation: 'modal', title: 'Edit Category' }}
      />
      <Stack.Screen
        name="order/[orderNumber]"
        options={{ title: 'Order Detail' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
