import { Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatPeso, PLAN_PRICES } from '@/lib/plan';

type Props = {
  // Overrides the default pitch, e.g. to explain why a button is disabled.
  message?: string;
};

// Stands in for everything outside Team and Prices on Free, and for actions a
// plan limit blocks.
export function UpgradeCard({ message }: Props) {
  return (
    <View
      className="rounded-3xl bg-white px-5 py-5 dark:bg-card-dark"
      style={{
        shadowColor: '#1A1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-chip dark:bg-chip-dark">
          <IconSymbol name="star.fill" size={20} color="#560591" />
        </View>
        <Text className="flex-1 text-sm font-semibold text-ink dark:text-white">
          {message ??
            `Get the full Admin app with sales reports, drivers and more, Starter ${formatPeso(PLAN_PRICES.starter.monthly)}/month.`}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push('/plan')}
        activeOpacity={0.85}
        className="mt-4 w-full items-center rounded-xl bg-primary py-3"
      >
        <Text className="text-sm font-semibold text-white">Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}
