import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListItem } from '@/components/ui/list-item';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { fulfillmentLabel, paymentLabel, paymentVariant } from '@/features/orders/utils';
import { useReconciliationData } from '@/features/reconciliation/hooks/use-reconciliation-data';
import { PaymentTypesCard } from '@/features/sales/components/payment-types-card';
import { PeriodPickerModal } from '@/features/sales/components/period-picker-modal';
import { fmtPeso } from '@/features/sales/utils';

export default function ReconciliationScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  useEffect(() => {
    if (token) loadBranches(token);
  }, [token, loadBranches]);

  const {
    period,
    setOffset,
    salesByPayment,
    paidOrders,
    overallTotal,
    loading,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  } = useReconciliationData({ token, selectedBranch });

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <View className="bg-primary px-5 pb-5 pt-14 dark:bg-primary-700">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.75}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
          >
            <Text className="text-xl font-bold text-white">‹</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">Reconciliation</Text>
            <Text className="text-xs text-primary-200" numberOfLines={1}>
              {selectedBranch?.name ?? 'All Branches'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
          >
            <IconSymbol name="storefront.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="mt-3 flex-row items-center">
          <TouchableOpacity
            onPress={() => setOffset((o) => o - 1)}
            disabled={!canGoBack}
            activeOpacity={0.5}
            className={`h-8 w-8 items-center justify-center ${!canGoBack ? 'opacity-30' : ''}`}
          >
            <Text className="text-2xl font-bold text-white">‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodModalVisible(true)}
            activeOpacity={0.8}
            className="mx-2 flex-1 items-center rounded-full bg-white/20 py-1.5"
          >
            <Text className="text-sm font-semibold text-white" numberOfLines={1}>
              {periodLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOffset((o) => o + 1)}
            disabled={!canGoForward}
            activeOpacity={0.5}
            className={`h-8 w-8 items-center justify-center ${!canGoForward ? 'opacity-30' : ''}`}
          >
            <Text className="text-2xl font-bold text-white">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BranchPickerModal
        visible={branchModalVisible}
        onClose={() => setBranchModalVisible(false)}
      />

      <PeriodPickerModal
        visible={periodModalVisible}
        period={period}
        onClose={() => setPeriodModalVisible(false)}
        onSelect={(key) => {
          setPeriodModalVisible(false);
          handlePeriodSelect(key);
        }}
      />

      {loading ? (
        <View className="items-center py-20">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : (
        <View className="gap-4 px-5 pb-10 pt-4">
          <Text className="text-xs text-muted">
            Grouped by the date each order was paid, not when it was placed — use this to check
            how much should be in the register.
          </Text>

          <StatCard label="Total Collected" value={fmtPeso(overallTotal)} color="indigo" />

          <PaymentTypesCard salesByPayment={salesByPayment} title="Collected By Method" />

          <View className="overflow-hidden rounded-xl bg-white dark:bg-zinc-900">
            <Text className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-white">
              Paid Orders ({paidOrders.length})
            </Text>
            {paidOrders.length === 0 ? (
              <Text className="px-4 py-6 text-center text-sm text-muted">
                No paid orders in this period
              </Text>
            ) : (
              paidOrders.map((order) => (
                <ListItem
                  key={order.orderNumber}
                  title={(order.customer?.nickname ?? 'Unknown').toUpperCase()}
                  subtitle={fulfillmentLabel(order.fulfillmentType)}
                  right={
                    <View className="items-end gap-1">
                      <Text className="text-base font-bold text-zinc-900 dark:text-white">
                        {fmtPeso(Number(order.total))}
                      </Text>
                      <Badge
                        label={paymentLabel(order.paymentStatus)}
                        variant={paymentVariant(order.paymentStatus)}
                      />
                    </View>
                  }
                  onPress={() => router.push(`/order/${order.orderNumber}`)}
                />
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
