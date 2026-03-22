import '../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { BranchProvider } from '@/context/branch-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AppLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#560591',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#111827',
    border: '#E5E7EB',
    notification: '#560591',
  },
};

const AppDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#9130F0',
    background: '#0F172A',
    card: '#1E2B6B',
    text: '#F9FAFB',
    border: '#1E293B',
    notification: '#9130F0',
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
        <AuthProvider>
          <BranchProvider>
            <BottomSheetModalProvider>
              <RootLayoutNav />
            </BottomSheetModalProvider>
          </BranchProvider>
        </AuthProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
