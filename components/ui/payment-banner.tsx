import { Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccount } from '@/context/account-context';
import { paymentStatus, planLabel } from '@/lib/plan';

type Tone = 'checking' | 'overdue' | 'lapsed';

const TONES: Record<Tone, { box: string; badge: string; iconColor: string }> = {
  checking: { box: 'border-white/20 bg-white/15', badge: 'bg-white/25', iconColor: '#FFFFFF' },
  overdue: { box: 'border-amber-300/60 bg-amber-400/25', badge: 'bg-amber-300', iconColor: '#78350F' },
  lapsed: { box: 'border-red-300/60 bg-red-500/30', badge: 'bg-red-200', iconColor: '#7F1D1D' },
};

// Shown under every tab's header once a paid shop's paid_until has passed: amber
// during the grace period, red once the shop has the Free limits, and calm once
// the owner has sent "I've paid" and we're checking it.
export function PaymentBanner() {
  const { tenant } = useAccount();
  const status = tenant ? paymentStatus(tenant) : null;
  if (!tenant || !status) return null;

  const plan = planLabel(tenant.plan);
  const pending = tenant.pending_payment;
  const tone: Tone = pending ? 'checking' : status.kind;

  let title: string;
  let detail: string;
  if (pending) {
    title = "Payment sent · We're checking it";
    detail = `Ref ${pending.reference} · ${
      status.kind === 'lapsed' ? `${plan} turns back on once confirmed` : 'usually within a day'
    }`;
  } else if (status.kind === 'lapsed') {
    title = 'Payment overdue · Now on Free';
    detail = `Pay to turn ${plan} back on`;
  } else {
    title = 'Payment overdue';
    detail =
      status.graceDaysLeft === 0
        ? `Pay today to keep ${plan}`
        : `Pay by ${status.lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to keep ${plan}`;
  }
  const action = pending ? 'View' : 'Pay';
  const { box, badge, iconColor } = TONES[tone];

  return (
    <TouchableOpacity
      onPress={() => router.push('/plan')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}. ${action}`}
      className={`mt-3 flex-row items-center gap-3 rounded-2xl border px-3 py-2.5 ${box}`}
    >
      <View className={`h-8 w-8 items-center justify-center rounded-full ${badge}`}>
        <IconSymbol
          name={pending ? 'paperplane.fill' : 'exclamationmark.triangle'}
          size={16}
          color={iconColor}
        />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-white" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-xs text-primary-100" numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View className="rounded-full bg-white px-3.5 py-1.5">
        <Text className="text-xs font-bold text-primary">{action}</Text>
      </View>
    </TouchableOpacity>
  );
}
