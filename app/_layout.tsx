import '../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
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
  const initialAuthHandled = useRef(false);

  // Always show splash on launch
  useEffect(() => {
    router.replace('/splash-preview');
  }, []);

  // After splash handles first navigation, redirect to login on logout
  useEffect(() => {
    if (isLoading) return;
    if (!initialAuthHandled.current) {
      initialAuthHandled.current = true;
      return;
    }
    if (!token) {
      router.replace('/login');
    }
  }, [token, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="splash-preview" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="reconciliation" options={{ headerShown: false }} />
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
      <Stack.Screen
        name="new-expense"
        options={{ presentation: 'modal', title: 'New Expense' }}
      />
      <Stack.Screen
        name="edit-expense"
        options={{ presentation: 'modal', title: 'Edit Expense' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Ceoruse: require('@/assets/fonts/ceoruse.otf'),
    HelveticaRoundedBold: require('@/assets/fonts/HelveticaRoundedBold.otf'),
  });

  if (!fontsLoaded) return null;

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
