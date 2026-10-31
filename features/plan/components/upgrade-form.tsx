import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/context/toast-context';
import { requestUpgrade } from '@/lib/api';
import {
  EXTRA_BRANCH_MONTHLY,
  formatPeso,
  PLAN_PRICES,
  type BillingCycle,
  type PaidPlan,
} from '@/lib/plan';

type Props = {
  token: string | null;
  // The plan screen owns the choice so the payment card can quote the same plan.
  plan: PaidPlan;
  cycle: BillingCycle;
  onPlanChange: (plan: PaidPlan) => void;
  onCycleChange: (cycle: BillingCycle) => void;
};

const PLAN_PERKS: Record<PaidPlan, string> = {
  starter: 'Full Admin app, sales reports, unlimited staff and drivers, 1 branch.',
  pro: `Everything in Starter, up to 3 branches (+${formatPeso(EXTRA_BRANCH_MONTHLY)}/month each extra) and unlimited admins.`,
};

export function UpgradeForm({ token, plan, cycle, onPlanChange: setPlan, onCycleChange: setCycle }: Props) {
  const { showToast } = useToast();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const price = PLAN_PRICES[plan][cycle];

  async function handleSubmit() {
    if (!token) return;
    setIsSubmitting(true);
    setError(null);
    const result = await requestUpgrade(token, {
      plan,
      billing_cycle: cycle,
      note: note.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result.ok) {
      setSentMessage(result.data.message);
      showToast('Upgrade request sent');
    } else {
      // e.g. the 429 after 3 requests in a day; the API's message says what to do.
      setError(result.error.message);
    }
  }

  return (
    <Card title="Upgrade">
      <View className="gap-3">
        {(Object.keys(PLAN_PRICES) as PaidPlan[]).map((key) => {
          const p = PLAN_PRICES[key];
          const active = key === plan;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setPlan(key)}
              activeOpacity={0.8}
              className={`rounded-2xl border-2 px-4 py-3 ${
                active ? 'border-primary dark:border-primary-400' : 'border-divide dark:border-divide-dark'
              }`}
            >
              <View className="flex-row items-baseline justify-between">
                <Text className="text-base font-bold text-ink dark:text-white">{p.name}</Text>
                <Text className="text-sm font-semibold text-ink dark:text-white">
                  {formatPeso(p.monthly)}/mo
                  <Text className="font-normal text-muted"> or {formatPeso(p.yearly)}/yr</Text>
                </Text>
              </View>
              <Text className="mt-1 text-xs text-subtle dark:text-subtle-dark">{PLAN_PERKS[key]}</Text>
            </TouchableOpacity>
          );
        })}

        <ChoiceChips
          label="Billing"
          value={cycle}
          onChange={setCycle}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly (2 months free)' },
          ]}
        />

        <TextInput
          label="Note (optional)"
          placeholder="e.g. the best time to call"
          value={note}
          onChangeText={setNote}
          maxLength={500}
          autoCapitalize="sentences"
        />

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}
        {sentMessage ? (
          <Text className="text-sm text-emerald">{sentMessage}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
          className={`w-full items-center rounded-xl bg-primary py-3.5${isSubmitting ? ' opacity-50' : ''}`}
        >
          <Text className="text-sm font-semibold text-white">
            {isSubmitting
              ? 'Sending...'
              : `Request ${PLAN_PRICES[plan].name}, ${formatPeso(price)}/${cycle === 'monthly' ? 'month' : 'year'}`}
          </Text>
        </TouchableOpacity>
        <Text className="text-xs text-muted">
          We&apos;ll email you how to pay. Already paid? Tap I&apos;ve paid on this screen and we&apos;ll switch your
          plan as soon as it&apos;s confirmed.
        </Text>
      </View>
    </Card>
  );
}
