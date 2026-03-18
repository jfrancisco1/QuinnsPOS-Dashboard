import { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { BranchPicker } from "@/components/ui/branch-picker";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/context/auth-context";
import { useBranch } from "@/context/branch-context";
import { getExpenses, getOrders, getSalesSummary, type Expense, type Order, type SalesSummary } from "@/lib/api";

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
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardScreen() {
  const { token } = useAuth();
  const { selectedBranch, syncBranchesFromOrders } = useBranch();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getOrders(token), getExpenses(token), getSalesSummary(token, 'today')]).then(
        ([ordRes, expRes, sumRes]) => {
          if (ordRes.ok) {
            setAllOrders(ordRes.data);
            syncBranchesFromOrders(ordRes.data);
          }
          if (expRes.ok) setExpenses(expRes.data);
          if (sumRes.ok) setSummary(sumRes.data);
          setLoading(false);
        },
      );
    }, [token, syncBranchesFromOrders]),
  );

  const orders = selectedBranch
    ? allOrders.filter((o) => o.branch?.id === selectedBranch.id)
    : allOrders;

  const todayExpenses = expenses.filter((e) => isToday(e.expense_date));
  const totalExpenses = todayExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "paid");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const header = (
    <>
      {/* Hero header */}
      <View className="bg-sky-500 px-4 pb-6 pt-14">
        <Text className="text-xs font-semibold uppercase tracking-widest text-sky-200">
          Quinn&apos;s Laundry
        </Text>
        <Text className="mt-1 text-2xl font-bold text-white">
          Good day! 👋
        </Text>
        <Text className="mt-0.5 text-sm text-sky-100">
          {today}
        </Text>
      </View>

      {/* Branch picker */}
      <BranchPicker />

      {/* Stat cards */}
      {loading ? (
        <View className="px-4 py-6">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</Text>
        </View>
      ) : (
        <View className="gap-3 px-4 py-4">
          <View className="flex-row gap-3">
            <StatCard color="sky" label="Net Sales" value={fmt(summary?.netSales ?? 0)} />
            <StatCard color="emerald" label="Gross Profit" value={fmt(summary?.grossProfit ?? 0)} />
          </View>
          <View className="flex-row gap-3">
            <StatCard color="amber" label="Today's Expenses" value={fmt(totalExpenses)} />
          </View>
        </View>
      )}

      {/* Section header */}
      {!loading && (
        <View className="mx-4 mb-2 mt-1 flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-widest text-sky-500">
            Unpaid Orders
          </Text>
          {unpaidOrders.length > 0 && (
            <View className="rounded-full bg-rose-500 px-2 py-0.5">
              <Text className="text-xs font-bold text-white">{unpaidOrders.length}</Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  return (
    <FlatList
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      data={loading ? [] : unpaidOrders}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/order/${item.id}`)}
          activeOpacity={0.7}
          className="mx-4 mb-2 overflow-hidden rounded-2xl bg-white dark:bg-zinc-900"
        >
          <View className="w-1.5 absolute bottom-0 left-0 top-0 bg-rose-400" />
          <View className="flex-row items-center justify-between py-3 pl-5 pr-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-zinc-900 dark:text-white">
                #{item.orderNumber}
              </Text>
              <Text className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {item.customer.nickname} · {item.fulfillmentType}
              </Text>
            </View>
            <Text className="text-base font-bold text-rose-500">
              {fmt(Number(item.total))}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        loading ? null : (
          <View className="items-center px-4 py-10">
            <Text className="text-3xl">✨</Text>
            <Text className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              All orders are settled!
            </Text>
          </View>
        )
      }
      ListFooterComponent={<View className="h-8" />}
    />
  );
}
