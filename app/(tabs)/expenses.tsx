import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, SectionList, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { ErrorState } from '@/components/ui/error-state';
import { FAB } from '@/components/ui/fab';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { UpdatingPill } from '@/components/ui/updating-pill';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { ExpenseCategoryChart } from '@/features/expenses/components/expense-category-chart';
import { ExpenseCategoryChips } from '@/features/expenses/components/expense-category-chips';
import { ExpenseListItem } from '@/features/expenses/components/expense-list-item';
import { ExpenseSearchBar } from '@/features/expenses/components/expense-search-bar';
import { ExpenseSummaryRow } from '@/features/expenses/components/expense-summary-row';
import { ExpenseTrendChart } from '@/features/expenses/components/expense-trend-chart';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { PeriodPickerModal } from '@/features/sales/components/period-picker-modal';
import { type Expense } from '@/lib/api';

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ExpensesScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  const {
    expenses,
    categories,
    total,
    count,
    trendSeries,
    categoryBreakdown,
    period,
    setOffset,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    loading,
    updating,
    refreshing,
    onRefresh,
    errorMessage,
    retry,
  } = useExpenses({ token, selectedBranch, loadBranches });

  // Grouped by expense_date; the (slow) date label is formatted once per day.
  const sections = useMemo(() => {
    const byDay = new Map<string, { title: string; data: Expense[] }>();
    for (const expense of expenses) {
      let section = byDay.get(expense.expense_date);
      if (!section) {
        section = { title: fmtDate(expense.expense_date), data: [] };
        byDay.set(expense.expense_date, section);
      }
      section.data.push(expense);
    }
    return Array.from(byDay.values());
  }, [expenses]);

  const onChartLayout = useCallback((width: number) => setChartWidth(width), []);

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader title="Expenses" subtitle={selectedBranch?.name} onBranchPress={() => setBranchModalVisible(true)}>
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

        <ExpenseCategoryChips
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      </ScreenHeader>

      <ExpenseSearchBar value={searchQuery} onChangeText={setSearchQuery} />

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
      ) : loading ? (
        <View className="gap-4 px-4 pt-4">
          <SkeletonCard lines={1} />
          <SkeletonList rows={5} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={9}
          ListHeaderComponent={
            <View className="gap-4 px-4 pb-2 pt-4">
              <ExpenseSummaryRow total={total} count={count} />
              <ExpenseTrendChart trendSeries={trendSeries} containerWidth={chartWidth} onLayout={onChartLayout} />
              <ExpenseCategoryChart breakdown={categoryBreakdown} />
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="border-b border-divide bg-page px-4 py-2 dark:border-divide-dark dark:bg-page-dark">
              <Text className="text-sm font-bold text-emerald">{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => <ExpenseListItem expense={item} />}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-muted">No expenses match your filters</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <UpdatingPill visible={updating && !refreshing && !loading && !errorMessage} />
      <FAB onPress={() => router.push('/new-expense')} />
    </View>
  );
}
