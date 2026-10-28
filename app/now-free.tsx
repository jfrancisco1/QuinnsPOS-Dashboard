import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccount } from '@/context/account-context';
import { formatPeso, PLAN_PRICES } from '@/lib/plan';

// One-time notice the first time a shop opens the app after its trial ended.
export default function NowFreeScreen() {
  const insets = useSafeAreaInsets();
  const { dismissFreeNotice } = useAccount();

  async function handleContinue() {
    await dismissFreeNotice();
    router.replace('/(tabs)');
  }

  async function handleSeePlans() {
    await dismissFreeNotice();
    router.replace('/(tabs)');
    router.push('/plan');
  }

  return (
    <ScrollView
      className="flex-1 bg-page dark:bg-page-dark"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 px-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-chip dark:bg-chip-dark">
          <IconSymbol name="star.fill" size={30} color="#560591" />
        </View>
        <Text className="mt-6 text-3xl font-bold text-ink dark:text-white">You&apos;re now on Free</Text>
        <Text className="mt-3 text-base text-subtle dark:text-subtle-dark">
          Your 30-day Pro trial has ended. Nothing is locked out:
        </Text>

        <View className="mt-6 gap-4">
          <Point title="The Staff app keeps working" body="Your counter can keep taking orders as usual." />
          <Point title="This app keeps Team and Prices" body="Manage your staff login and your price list any time." />
          <Point
            title="Want reports and drivers back?"
            body={`Get the full Admin app with Starter at ${formatPeso(PLAN_PRICES.starter.monthly)}/month.`}
          />
        </View>
      </View>

      <View className="gap-3 px-8 pt-8">
        <TouchableOpacity
          onPress={handleSeePlans}
          activeOpacity={0.85}
          className="w-full items-center rounded-lg bg-primary py-3.5"
        >
          <Text className="text-sm font-bold text-white">See plans</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.7} className="items-center py-2">
          <Text className="text-sm font-semibold text-muted">Continue on Free</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Point({ title, body }: { title: string; body: string }) {
  return (
    <View className="flex-row gap-3">
      <IconSymbol name="checkmark.circle.fill" size={22} color="#10B981" />
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink dark:text-white">{title}</Text>
        <Text className="mt-0.5 text-sm text-subtle dark:text-subtle-dark">{body}</Text>
      </View>
    </View>
  );
}
