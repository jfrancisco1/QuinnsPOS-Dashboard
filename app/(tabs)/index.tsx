import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { getExpenses, getOrders, getSalesSummary, type Expense, type Order, type SalesSummary } from '@/lib/api';

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function fmt(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getOrders(token), getExpenses(token), getSalesSummary(token, 'today'), loadBranches(token)]).then(
        ([ordRes, expRes, sumRes]) => {
          if (ordRes.ok) setAllOrders(ordRes.data);
          if (expRes.ok) setExpenses(expRes.data);
          if (sumRes.ok) setSummary(sumRes.data);
          setLoading(false);
        },
      );
    }, [token, loadBranches]),
  );

  const orders = selectedBranch
    ? allOrders.filter((o) => o.branch?.id === selectedBranch.id)
    : allOrders;

  const todayExpenses = expenses.filter((e) => isToday(e.expense_date));
  const totalExpenses = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== 'paid');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  const header = (
    <>
      {/* Top header */}
      <View className="bg-primary px-5 pb-5 pt-14 dark:bg-primary-700">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-primary-200">
              Quinn&apos;s Laundry
            </Text>
            <Text className="mt-0.5 text-2xl font-bold text-white">Dashboard</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-xs text-primary-200">{today}</Text>
              {selectedBranch ? (
                <>
                  <Text className="text-xs text-primary-200">·</Text>
                  <Text className="text-xs font-semibold text-white">{selectedBranch.name}</Text>
                </>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="rounded-2xl bg-white/20 p-3"
          >
            <IconSymbol name="storefront.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <BranchPickerModal visible={branchModalVisible} onClose={() => setBranchModalVisible(false)} />

      {/* Stat cards */}
      {loading ? (
        <View className="px-5 py-8">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : (
        <View className="gap-3 px-5 py-5">
          <StatCard color="default" label="Net Sales" value={fmt(summary?.netSales ?? 0)} />
          <View className="flex-row gap-3">
            <StatCard color="emerald" label="Gross Profit" value={fmt(summary?.grossProfit ?? 0)} />
            <StatCard color="amber" label="Expenses" value={fmt(totalExpenses)} />
          </View>
        </View>
      )}

      {/* Section header */}
      {!loading && (
        <View className="mx-5 mb-2 mt-1 flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-widest text-muted">
            Unpaid Orders
          </Text>
          {unpaidOrders.length > 0 && (
            <View className="rounded-full bg-rose-500 px-2.5 py-0.5">
              <Text className="text-xs font-bold text-white">{unpaidOrders.length}</Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  return (
    <FlatList
      className="flex-1 bg-white dark:bg-page-dark"
      data={loading ? [] : unpaidOrders}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/order/${item.id}`)}
          activeOpacity={0.75}
          className="mx-5 mb-3 overflow-hidden rounded-2xl bg-white dark:bg-card-dark"
          style={{
            shadowColor: '#1A1F3C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View className="h-0.5 w-full bg-rose-400" />

          <View className="flex-row items-center px-4 py-4">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-ink dark:text-white" numberOfLines={1}>
                {item.customer.nickname}
              </Text>

              <View className="mt-1.5 flex-row items-center gap-2">
                <Text className="text-xs text-muted">#{item.orderNumber}</Text>
                <View className="rounded-full bg-chip px-2 py-0.5 dark:bg-chip-dark">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-subtle dark:text-muted-dark">
                    {item.fulfillmentType}
                  </Text>
                </View>
                <View className="rounded-full bg-rose-50 px-2 py-0.5 dark:bg-rose-900/20">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-rose-500">
                    Unpaid
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-lg font-extrabold text-rose-500">
              {fmt(Number(item.total))}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        loading ? null : (
          <View className="items-center px-4 py-12">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-card-dark">
              <IconSymbol name="checkmark.circle.fill" size={32} color="#3B55D5" />
            </View>
            <Text className="text-sm font-semibold text-subtle dark:text-muted-dark">
              All orders are settled!
            </Text>
          </View>
        )
      }
      ListFooterComponent={<View className="h-8" />}
    />
  );
}
