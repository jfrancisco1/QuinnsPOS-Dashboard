import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccount } from '@/context/account-context';
import { formatApiDate, PLAN_PRICES, formatPeso } from '@/lib/plan';

// Shown once, right after a new owner sets their password.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { tenant } = useAccount();
  const trialEnds = tenant?.on_trial && tenant.trial_ends_at ? formatApiDate(tenant.trial_ends_at) : null;

  return (
    <ScrollView
      className="flex-1 bg-primary"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 px-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
          <IconSymbol name="sparkles" size={32} color="#fff" />
        </View>
        <Text className="mt-6 text-3xl font-bold text-white">Welcome to Quinns POS</Text>
        <Text className="mt-3 text-base text-primary-100">
          {tenant ? `${tenant.name} is ready. ` : ''}Your shop is on a free 30-day Pro trial
          {trialEnds ? `, until ${trialEnds}` : ''}.
        </Text>

        <View className="mt-8 gap-4">
          <WelcomePoint
            title="Everything is unlocked"
            body="Sales reports, orders, expenses, drivers and up to 3 branches while your trial runs."
          />
          <WelcomePoint
            title="After the trial"
            body={`Keep the full Admin app from ${formatPeso(PLAN_PRICES.starter.monthly)}/month. Or stay on Free: the Staff app keeps working, and this app keeps Team and Prices.`}
          />
          <WelcomePoint
            title="Next: set up your shop"
            body="Check your branch and prices, add your staff, then take your first order."
          />
        </View>
      </View>

      <View className="px-8 pt-8">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
          className="w-full items-center rounded-lg bg-white py-3.5"
        >
          <Text className="text-sm font-bold text-primary">Set up my shop</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function WelcomePoint({ title, body }: { title: string; body: string }) {
  return (
    <View className="flex-row gap-3">
      <IconSymbol name="checkmark.circle.fill" size={22} color="#fff" />
      <View className="flex-1">
        <Text className="text-sm font-bold text-white">{title}</Text>
        <Text className="mt-0.5 text-sm text-primary-100">{body}</Text>
      </View>
    </View>
  );
}
