import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAccount } from '@/context/account-context';
import { useAuth } from '@/context/auth-context';
import { CurrentPlanCard } from '@/features/plan/components/current-plan-card';
import { PaymentCard } from '@/features/plan/components/payment-card';
import { UpgradeForm } from '@/features/plan/components/upgrade-form';
import type { BillingCycle, PaidPlan } from '@/lib/plan';

export default function PlanScreen() {
  const { token } = useAuth();
  const { tenant } = useAccount();
  // A paying shop renews what it has; anyone else starts from Starter, monthly.
  const isPaying = tenant?.plan === 'starter' || tenant?.plan === 'pro';
  const [plan, setPlan] = useState<PaidPlan>(isPaying ? (tenant.plan as PaidPlan) : 'starter');
  const [cycle, setCycle] = useState<BillingCycle>(tenant?.billing_cycle ?? 'monthly');

  const payment = <PaymentCard token={token} plan={plan} cycle={cycle} />;
  const upgrade = (
    <UpgradeForm token={token} plan={plan} cycle={cycle} onPlanChange={setPlan} onCycleChange={setCycle} />
  );

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark" keyboardShouldPersistTaps="handled">
      <View className="gap-4 px-5 pb-10 pt-4">
        {tenant ? (
          <CurrentPlanCard tenant={tenant} />
        ) : (
          <Text className="text-sm text-muted">Unable to load your plan.</Text>
        )}
        {/* Paying shops come here to renew, so how to pay goes first; others pick a plan first. */}
        {isPaying ? payment : upgrade}
        {isPaying ? upgrade : payment}
      </View>
    </ScrollView>
  );
}
