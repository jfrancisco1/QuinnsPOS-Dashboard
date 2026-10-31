import { useEffect, useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';

import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { TextInput } from '@/components/ui/text-input';
import { useAccount } from '@/context/account-context';
import { useToast } from '@/context/toast-context';
import { getPaymentInfo, submitPayment, type PaymentInfo, type PaymentMethod } from '@/lib/api';
import { formatApiDate, formatPeso, PLAN_PRICES, type BillingCycle, type PaidPlan } from '@/lib/plan';

type Props = {
  token: string | null;
  plan: PaidPlan;
  cycle: BillingCycle;
};

// The cropped QR image is 600 x 714.
const QR_WIDTH = 220;
const QR_HEIGHT = Math.round((QR_WIDTH * 714) / 600);

// How to pay for the chosen plan (amount, GCash QR and number, bank), then
// "I've paid" with the reference number so we can check it and switch the plan.
export function PaymentCard({ token, plan, cycle }: Props) {
  const { showToast } = useToast();
  const { refresh } = useAccount();
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('gcash');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getPaymentInfo(token, plan, cycle).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setInfo(result.data);
        setAmount(String(result.data.amount));
        setLoadError(null);
      } else {
        setLoadError(result.error.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, plan, cycle]);

  async function copy(value: string, what: string) {
    await Clipboard.setStringAsync(value);
    showToast(`${what} copied`);
  }

  async function handleSubmit() {
    if (!token || !info) return;
    const trimmed = reference.trim();
    const pesos = Number(amount);
    if (!trimmed) {
      setError('Enter the reference number from your receipt.');
      return;
    }
    if (!Number.isInteger(pesos) || pesos <= 0) {
      setError('Enter the amount you paid, in pesos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await submitPayment(token, {
      plan,
      billing_cycle: cycle,
      amount: pesos,
      method,
      reference: trimmed,
    });
    setIsSubmitting(false);
    if (result.ok) {
      setInfo({ ...info, pending_submission: result.data.data });
      setReference('');
      showToast('Payment sent');
      // Reload /me so the payment banner switches to "We're checking it".
      refresh();
    } else {
      // e.g. the 429 after 5 in a day; the API's message says what to do.
      setError(result.error.message);
    }
  }

  if (loadError) {
    return (
      <Card title="How to pay">
        <Text className="text-sm text-red-500 dark:text-red-400">{loadError}</Text>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card title="How to pay">
        <Text className="text-sm text-muted">Loading...</Text>
      </Card>
    );
  }

  const period = cycle === 'yearly' ? 'year' : 'month';
  const pending = info.pending_submission;

  return (
    <Card title="How to pay">
      <View className="gap-4">
        <View className="flex-row items-center justify-between rounded-2xl bg-chip px-4 py-3 dark:bg-chip-dark">
          <View>
            <Text className="text-xs text-subtle dark:text-subtle-dark">
              {PLAN_PRICES[plan].name}, 1 {period}
            </Text>
            <Text className="text-2xl font-bold text-ink dark:text-white">{formatPeso(info.amount)}</Text>
          </View>
          <CopyButton onPress={() => copy(String(info.amount), 'Amount')} />
        </View>

        {info.gcash ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink dark:text-white">GCash, Maya or any bank app</Text>
            {info.gcash.qr_url ? (
              <TouchableOpacity
                onPress={() => info.gcash?.qr_url && Linking.openURL(info.gcash.qr_url)}
                activeOpacity={0.85}
                accessibilityRole="imagebutton"
                accessibilityLabel="GCash QR code. Opens the image so you can save it"
                className="items-center"
              >
                <Image
                  source={{ uri: info.gcash.qr_url }}
                  style={{ width: QR_WIDTH, height: QR_HEIGHT, borderRadius: 12 }}
                  contentFit="contain"
                />
                <Text className="mt-1 text-xs text-muted">
                  Tap to open and save it, then use Upload QR in your app
                </Text>
              </TouchableOpacity>
            ) : null}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm text-ink dark:text-white">{info.gcash.number}</Text>
                {info.gcash.name ? <Text className="text-xs text-muted">{info.gcash.name}</Text> : null}
              </View>
              <CopyButton onPress={() => info.gcash && copy(info.gcash.number, 'GCash number')} />
            </View>
          </View>
        ) : null}

        {info.bank_details ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-ink dark:text-white">Bank transfer</Text>
              <Text className="text-sm text-ink dark:text-white">{info.bank_details}</Text>
            </View>
            <CopyButton onPress={() => info.bank_details && copy(info.bank_details, 'Bank details')} />
          </View>
        ) : null}

        {!info.gcash && !info.bank_details ? (
          <Text className="text-sm text-muted">Send an upgrade request and we&apos;ll email you how to pay.</Text>
        ) : null}

        <View className="h-px bg-divide dark:bg-divide-dark" />

        {pending ? (
          <View className="rounded-2xl bg-amber-100 px-4 py-3 dark:bg-amber-900/40">
            <Text className="text-sm font-semibold text-amber-900 dark:text-amber-200">We&apos;re checking your payment</Text>
            <Text className="mt-0.5 text-xs text-amber-900 dark:text-amber-200">
              {formatPeso(pending.amount)} by {pending.method === 'gcash' ? 'GCash' : 'bank transfer'}, ref{' '}
              {pending.reference}, paid {formatApiDate(pending.paid_on)}. Your plan updates as soon as it&apos;s
              confirmed, usually within a day.
            </Text>
          </View>
        ) : null}

        <Text className="text-sm font-semibold text-ink dark:text-white">
          {pending ? 'Sent the wrong details? Send them again' : "I've paid"}
        </Text>
        <ChoiceChips
          value={method}
          onChange={setMethod}
          options={[
            { value: 'gcash', label: 'GCash / QR' },
            { value: 'bank', label: 'Bank transfer' },
          ]}
        />
        <TextInput
          label="Reference number"
          placeholder={method === 'gcash' ? 'e.g. 1012 345 678901' : 'From your bank receipt'}
          value={reference}
          onChangeText={setReference}
          maxLength={64}
          autoCapitalize="characters"
        />
        <TextInput
          label="Amount paid (₱)"
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={7}
        />

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
          className={`w-full items-center rounded-xl bg-primary py-3.5${isSubmitting ? ' opacity-50' : ''}`}
        >
          <Text className="text-sm font-semibold text-white">{isSubmitting ? 'Sending...' : "Send I've paid"}</Text>
        </TouchableOpacity>
        <Text className="text-xs text-muted">
          We match the reference number with our GCash or bank history, then switch your plan. Nothing changes
          until then.
        </Text>
      </View>
    </Card>
  );
}

function CopyButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      className="rounded-full bg-white px-3 py-1.5 dark:bg-card-dark"
    >
      <Text className="text-xs font-bold text-primary dark:text-primary-300">Copy</Text>
    </TouchableOpacity>
  );
}
