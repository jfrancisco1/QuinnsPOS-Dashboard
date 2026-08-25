import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { BreakdownCard } from '@/features/sales/components/breakdown-card';
import { LoadsCard } from '@/features/sales/components/loads-card';
import { PaymentTypesCard } from '@/features/sales/components/payment-types-card';
import { PeriodPickerModal } from '@/features/sales/components/period-picker-modal';
import { SalesByItemsCard } from '@/features/sales/components/sales-by-items-card';
import { SalesOverviewChart } from '@/features/sales/components/sales-overview-chart';
import { useSalesData } from '@/features/sales/hooks/use-sales-data';

export default function SalesScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [chartContainerWidth, setChartContainerWidth] = useState(0);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  useEffect(() => {
    if (token) loadBranches(token);
  }, [token, loadBranches]);

  const {
    period,
    setOffset,
    summary,
    salesByItem,
    itemsMap,
    salesByPayment,
    totalLoads,
    loadsOrderCount,
    loadsBreakdown,
    dailySummaries,
    granularity,
    loading,
    totalExpenses,
    grossProfit,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  } = useSalesData({ token, selectedBranch });

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader
        title="Sales"
        subtitle={selectedBranch?.name}
        onBranchPress={() => setBranchModalVisible(true)}
      >
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
      </ScreenHeader>

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
          <SalesOverviewChart
            granularity={granularity}
            dailySummaries={dailySummaries}
            containerWidth={chartContainerWidth}
            onLayout={setChartContainerWidth}
          />

          <BreakdownCard
            summary={summary}
            grossProfit={grossProfit}
            totalExpenses={totalExpenses}
          />

          <LoadsCard
            totalLoads={totalLoads}
            orderCount={loadsOrderCount}
            breakdown={loadsBreakdown}
            itemsMap={itemsMap}
          />

          <SalesByItemsCard salesByItem={salesByItem} itemsMap={itemsMap} />

          <PaymentTypesCard salesByPayment={salesByPayment} />

          <TouchableOpacity
            onPress={() => router.push('/reconciliation')}
            activeOpacity={0.8}
            className="flex-row items-center justify-between rounded-3xl bg-white px-5 py-4 dark:bg-card-dark"
            style={{
              shadowColor: '#1A1F3C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.07,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            <View>
              <Text className="text-sm font-bold text-ink dark:text-white">Reconciliation</Text>
              <Text className="mt-0.5 text-xs text-muted">
                Cash &amp; payment totals by date paid
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#8A8FA8" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
