import '../global.css';

import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { BranchProvider } from '@/context/branch-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

const VioletLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7C3AED',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1E1B4B',
    border: '#EDE9FE',
    notification: '#7C3AED',
  },
};

const VioletDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#A78BFA',
    background: '#13111C',
    card: '#1A1625',
    text: '#F5F3FF',
    border: '#2D1F4E',
    notification: '#A78BFA',
  },
};

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
    <ThemeProvider value={colorScheme === 'dark' ? VioletDarkTheme : VioletLightTheme}>
      <AuthProvider>
        <BranchProvider>
          <RootLayoutNav />
        </BranchProvider>
      </AuthProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
