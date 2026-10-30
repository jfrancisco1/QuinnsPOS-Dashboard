import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { ErrorState } from '@/components/ui/error-state';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { UpdatingPill } from '@/components/ui/updating-pill';
import { UpgradeCard } from '@/components/ui/upgrade-card';
import { useAccount } from '@/context/account-context';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { SetupChecklist } from '@/features/onboarding/components/setup-checklist';
import { useSetupChecklist } from '@/features/onboarding/setup-checklist-context';
import { BreakdownCard } from '@/features/sales/components/breakdown-card';
import { LoadsCard } from '@/features/sales/components/loads-card';
import { OrderTypesCard } from '@/features/sales/components/order-types-card';
import { PaymentTypesCard } from '@/features/sales/components/payment-types-card';
import { PeriodPickerModal } from '@/features/sales/components/period-picker-modal';
import { ReadyOrdersCard } from '@/features/sales/components/ready-orders-card';
import { SalesByItemsCard } from '@/features/sales/components/sales-by-items-card';
import { SalesOverviewChart } from '@/features/sales/components/sales-overview-chart';
import { useSalesData } from '@/features/sales/hooks/use-sales-data';

// Until the shop is set up (or the owner hides the checklist), home shows only
// the setup checklist; the dashboard would be empty for a new shop anyway.
export default function HomeScreen() {
  const { hasFullApp } = useAccount();
  const { checklist, status, setStepDone, dismiss, reload } = useSetupChecklist();

  // Tick steps finished on other screens when coming back here.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (status !== 'done') {
    return (
      <ScrollView className="flex-1 bg-page dark:bg-page-dark">
        <ScreenHeader title="Home" />
        <View className="gap-4 px-5 pb-10 pt-4">
          {!hasFullApp ? <UpgradeCard /> : null}
          {checklist && status === 'active' ? (
            <SetupChecklist checklist={checklist} onToggle={setStepDone} onDismiss={dismiss} />
          ) : (
            <SkeletonCard lines={5} />
          )}
        </View>
      </ScrollView>
    );
  }
  return hasFullApp ? <SalesHome /> : <FreeHome />;
}

// Free after the trial: reports aren't included, so the dashboard is replaced
// by one upgrade card.
function FreeHome() {
  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader title="Home" />
      <View className="gap-4 px-5 pb-10 pt-4">
        <UpgradeCard />
      </View>
    </ScrollView>
  );
}

function SalesHome() {
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
    compareLabel,
    readyOrders,
    salesByItem,
    itemsMap,
    salesByPayment,
    totalLoads,
    loadsOrderCount,
    loadsBreakdown,
    ordersByFulfillment,
    dailySummaries,
    granularity,
    ready,
    updating,
    refreshing,
    onRefresh,
    errorMessage,
    retry,
    totalExpenses,
    grossProfit,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  } = useSalesData({ token, selectedBranch });

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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


        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={retry} />
        ) : (
          // Each card shows a skeleton until its data for the selected period
          // and branch arrives, so cards fill in one by one.
          <View className="gap-4 px-5 pb-10 pt-4">
            {ready.readyOrders ? <ReadyOrdersCard readyOrders={readyOrders} /> : <SkeletonCard hero lines={2} />}

            {ready.summary ? (
              <>
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
                  compareLabel={compareLabel}
                />
              </>
            ) : (
              <>
                <SkeletonCard lines={4} />
                <SkeletonCard lines={8} />
              </>
            )}

            {ready.loads ? (
              <>
                <LoadsCard
                  totalLoads={totalLoads}
                  orderCount={loadsOrderCount}
                  breakdown={loadsBreakdown}
                  itemsMap={itemsMap}
                />

                <OrderTypesCard ordersByFulfillment={ordersByFulfillment} />
              </>
            ) : (
              <SkeletonCard hero lines={3} />
            )}

            {ready.salesByItem ? (
              <SalesByItemsCard salesByItem={salesByItem} itemsMap={itemsMap} />
            ) : (
              <SkeletonCard lines={3} />
            )}

            {ready.salesByPayment ? <PaymentTypesCard salesByPayment={salesByPayment} /> : <SkeletonCard lines={3} />}

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
      <UpdatingPill visible={updating && !refreshing && ready.summary} />
    </View>
  );
}
