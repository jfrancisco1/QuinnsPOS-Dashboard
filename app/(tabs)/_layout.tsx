import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAccount } from '@/context/account-context';
import {
  SetupChecklistProvider,
  useSetupChecklist,
} from '@/features/onboarding/setup-checklist-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  return (
    <SetupChecklistProvider>
      <TabNavigator />
    </SetupChecklistProvider>
  );
}

function TabNavigator() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const insets = useSafeAreaInsets();
  const { loading, hasFullApp } = useAccount();
  const { status: setupStatus } = useSetupChecklist();
  // During setup, keep the tab bar to what the checklist uses (Home, Items, Team,
  // Settings). Orders and Expenses are empty for a new shop anyway, and they're
  // not part of Free at all.
  const showDaily = hasFullApp && setupStatus !== 'active';
  const showSales = hasFullApp && setupStatus === 'done';

  // Wait for /me so a Free shop never flashes the full app (and its 403s).
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark">
        <ActivityIndicator color={Colors[scheme].tint} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[scheme].tabIconSelected,
        tabBarInactiveTintColor: Colors[scheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[scheme].tabBarBackground,
          borderTopColor: scheme === 'dark' ? '#252845' : '#E8EAF6',
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#560591',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          // Holds the setup checklist during setup, and the upgrade card on Free.
          title: showSales ? 'Sales' : 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          href: showDaily ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: 'Items',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="tag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          href: showDaily ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="banknote.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
