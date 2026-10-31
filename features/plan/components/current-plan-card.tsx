import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import type { Tenant } from '@/lib/api';
import { formatApiDate, paymentStatus, planLabel, trialDaysLeft } from '@/lib/plan';

type Props = {
  tenant: Tenant;
};

function limitLabel(limit: number | null): string {
  return limit == null ? 'Unlimited' : String(limit);
}

export function CurrentPlanCard({ tenant }: Props) {
  const days = trialDaysLeft(tenant);
  const payment = paymentStatus(tenant);
  return (
    <Card title="Your plan">
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl font-bold text-ink dark:text-white">{planLabel(tenant.plan)}</Text>
        {tenant.on_trial ? (
          <View className="rounded-full bg-chip px-2.5 py-1 dark:bg-chip-dark">
            <Text className="text-xs font-semibold text-primary dark:text-primary-300">
              Pro trial · {days === 1 ? '1 day' : `${days} days`} left
            </Text>
          </View>
        ) : null}
      </View>
      {tenant.on_trial && tenant.trial_ends_at ? (
        <Text className="mt-1 text-xs text-muted">
          Everything in Pro until {formatApiDate(tenant.trial_ends_at)}, then Free unless you upgrade.
        </Text>
      ) : null}
      {payment?.kind === 'overdue' ? (
        <Text className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          Payment overdue. {planLabel(tenant.plan)} keeps working until{' '}
          {payment.lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, then the
          shop moves to Free until it&apos;s paid. Send a request below to get the payment details.
        </Text>
      ) : null}
      {payment?.kind === 'lapsed' ? (
        <Text className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
          Payment overdue, so the shop is on Free: reports and extra accounts are paused, nothing is deleted.{' '}
          {planLabel(tenant.plan)} comes back as soon as your payment is recorded.
        </Text>
      ) : null}

      <View className="mt-4 gap-2">
        <Row label="Billing cycle" value={tenant.billing_cycle ? planLabel(tenant.billing_cycle) : '—'} />
        <Row label="Paid until" value={tenant.paid_until ? formatApiDate(tenant.paid_until) : '—'} />
        <Row label="Branches" value={limitLabel(tenant.limits.max_branches)} />
        <Row label="Staff accounts" value={limitLabel(tenant.limits.max_staff)} />
        <Row label="Driver accounts" value={limitLabel(tenant.limits.max_drivers)} />
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-subtle dark:text-subtle-dark">{label}</Text>
      <Text className="text-sm font-semibold text-ink dark:text-white">{value}</Text>
    </View>
  );
}
