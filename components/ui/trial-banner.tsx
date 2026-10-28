import { Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccount } from '@/context/account-context';
import { parseApiDate, TRIAL_DAYS, trialDaysLeft } from '@/lib/plan';

// Last week of the trial: the banner turns amber so the end date isn't a surprise.
const URGENT_DAYS = 7;

function headline(days: number): string {
  if (days <= 0) return 'Pro trial ends today';
  if (days === 1) return 'Pro trial ends tomorrow';
  return `Pro trial · ${days} days left`;
}

// Shown under every tab's header while the shop is on its trial.
export function TrialBanner() {
  const { tenant } = useAccount();
  if (!tenant?.on_trial || !tenant.trial_ends_at) return null;

  const days = trialDaysLeft(tenant);
  const urgent = days <= URGENT_DAYS;
  const endDate = parseApiDate(tenant.trial_ends_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const remaining = Math.min(1, Math.max(0, days / TRIAL_DAYS));

  return (
    <TouchableOpacity
      onPress={() => router.push('/plan')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${headline(days)}. Ends ${endDate}. Upgrade`}
      className={`mt-3 overflow-hidden rounded-2xl border ${
        urgent ? 'border-amber-300/60 bg-amber-400/25' : 'border-white/20 bg-white/15'
      }`}
    >
      <View className="flex-row items-center gap-3 px-3 py-2.5">
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${
            urgent ? 'bg-amber-300' : 'bg-white/25'
          }`}
        >
          <IconSymbol name="star.fill" size={16} color={urgent ? '#78350F' : '#FFFFFF'} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-white" numberOfLines={1}>
            {headline(days)}
          </Text>
          <Text className="text-xs text-primary-100" numberOfLines={1}>
            Ends {endDate}, then Free
          </Text>
        </View>
        <View className="rounded-full bg-white px-3.5 py-1.5">
          <Text className="text-xs font-bold text-primary">Upgrade</Text>
        </View>
      </View>
      <View className="h-1 bg-white/15">
        <View
          className={`h-full ${urgent ? 'bg-amber-300' : 'bg-white/70'}`}
          style={{ width: `${remaining * 100}%` }}
        />
      </View>
    </TouchableOpacity>
  );
}
