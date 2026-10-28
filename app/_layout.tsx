import '../global.css';

import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  Theme,
  ThemeProvider,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AccountProvider, useAccount } from '@/context/account-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { BranchProvider } from '@/context/branch-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { ToastProvider } from '@/context/toast-context';
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

// Routes the account gate leaves alone: the splash still decides where to go,
// and login has no account yet.
const PRE_AUTH_ROUTES = ['', 'splash-preview', 'login'];

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

  // Account gate: a new owner must set their own password before anything else
  // (back button and deep links land here again), and an ended trial shows a
  // one-time "You're now on Free" screen. Runs on every route change and every
  // /me refresh, so it also catches the app resuming.
  const { user, freeNoticePending } = useAccount();
  const segments = useSegments();
  const route = segments[0] ?? '';
  useEffect(() => {
    if (!token || PRE_AUTH_ROUTES.includes(route)) return;
    if (user?.must_change_password) {
      if (route !== 'set-password') router.replace('/set-password');
      return;
    }
    if (freeNoticePending && route !== 'now-free' && route !== 'welcome') {
      router.replace('/now-free');
    }
  }, [token, user, freeNoticePending, route]);

  return (
    <Stack>
      <Stack.Screen name="splash-preview" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="set-password"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="now-free" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="plan" options={{ title: 'Plan' }} />
      <Stack.Screen name="branches" options={{ title: 'Branches' }} />
      <Stack.Screen name="team" options={{ title: 'Team' }} />
      <Stack.Screen name="new-branch" options={{ presentation: 'modal', title: 'Add Branch' }} />
      <Stack.Screen name="edit-branch" options={{ presentation: 'modal', title: 'Edit Branch' }} />
      <Stack.Screen
        name="new-team-member"
        options={{ presentation: 'modal', title: 'Add Person' }}
      />
      <Stack.Screen
        name="edit-team-member"
        options={{ presentation: 'modal', title: 'Edit Person' }}
      />
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
      <Stack.Screen name="expense-categories" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-expense-category"
        options={{ presentation: 'modal', title: 'New Category' }}
      />
      <Stack.Screen
        name="edit-expense-category"
        options={{ presentation: 'modal', title: 'Edit Category' }}
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
      <ThemePreferenceProvider>
        <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
          <AuthProvider>
            <AccountProvider>
              <BranchProvider>
                <ToastProvider>
                  <RootLayoutNav />
                </ToastProvider>
              </BranchProvider>
            </AccountProvider>
          </AuthProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </ThemePreferenceProvider>
    </GestureHandlerRootView>
  );
}
