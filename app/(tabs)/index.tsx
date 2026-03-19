import { useCallback, useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { IconSymbol } from "@/components/ui/icon-symbol";
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
  const { branches, selectedBranch, setSelectedBranch, syncBranchesFromOrders } = useBranch();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

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
    month: "long",
    day: "numeric",
  });

  const header = (
    <>
      {/* Hero header — matches screenshot style */}
      <View className="bg-[#3B55D5] px-5 pb-6 pt-14">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">Dashboard</Text>
            <Text className="mt-0.5 text-sm text-[#BFCEFF]">
              Quinn&apos;s Laundry House
            </Text>
          </View>

          {/* Branch selector icon */}
          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="mt-0.5 rounded-xl bg-white/20 p-2.5"
          >
            <IconSymbol name="storefront.fill" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Date row */}
        <Text className="mt-3 text-base font-semibold text-white/90">
          {today}
          {selectedBranch ? (
            <Text className="text-sm font-normal text-[#BFCEFF]">
              {' '}· {selectedBranch.name}
            </Text>
          ) : null}
        </Text>
      </View>

      {/* Branch picker modal */}
      <Modal
        visible={branchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setBranchModalVisible(false)}
        >
          <View
            className="mx-4 mt-28 rounded-2xl bg-white p-4 dark:bg-zinc-900"
            onStartShouldSetResponder={() => true}
          >
            <Text className="mb-3 text-base font-bold text-zinc-900 dark:text-white">
              Select Branch
            </Text>

            <TouchableOpacity
              onPress={() => { setSelectedBranch(null); setBranchModalVisible(false); }}
              className={`mb-2 flex-row items-center justify-between rounded-xl px-4 py-3 ${selectedBranch === null ? 'bg-[#3B55D5]' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              <Text className={`font-semibold ${selectedBranch === null ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>
                All Branches
              </Text>
              {selectedBranch === null && (
                <View className="h-2 w-2 rounded-full bg-white" />
              )}
            </TouchableOpacity>

            {branches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                onPress={() => { setSelectedBranch(branch); setBranchModalVisible(false); }}
                className={`mb-2 flex-row items-center justify-between rounded-xl px-4 py-3 ${selectedBranch?.id === branch.id ? 'bg-[#3B55D5]' : 'bg-zinc-100 dark:bg-zinc-800'}`}
              >
                <Text className={`font-semibold ${selectedBranch?.id === branch.id ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>
                  {branch.name}
                </Text>
                {selectedBranch?.id === branch.id && (
                  <View className="h-2 w-2 rounded-full bg-white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Stat cards */}
      {loading ? (
        <View className="px-4 py-6">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</Text>
        </View>
      ) : (
        <View className="gap-3 px-4 py-4">
          <View className="flex-row gap-3">
            <StatCard color="indigo" label="Net Sales" value={fmt(summary?.netSales ?? 0)} />
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
          <Text className="text-xs font-bold uppercase tracking-widest text-[#3B55D5]">
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
          activeOpacity={0.75}
          className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900"
        >
          {/* Left accent bar */}
          <View className="w-1 absolute bottom-0 left-0 top-0 bg-rose-500" />

          <View className="flex-row items-center py-4 pl-5 pr-4">
            {/* Left: name + meta */}
            <View className="flex-1 pr-3">
              {/* Customer name — large and prominent */}
              <Text className="text-lg font-bold text-zinc-900 dark:text-white" numberOfLines={1}>
                {item.customer.nickname}
              </Text>

              {/* Order number + fulfillment pill — small and subdued */}
              <View className="mt-1.5 flex-row items-center gap-2">
                <Text className="text-xs text-zinc-400 dark:text-zinc-500">
                  #{item.orderNumber}
                </Text>
                <View className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {item.fulfillmentType}
                  </Text>
                </View>
                <View className="rounded-full bg-rose-50 px-2 py-0.5 dark:bg-rose-900/30">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-rose-500">
                    Unpaid
                  </Text>
                </View>
              </View>
            </View>

            {/* Right: amount — bold and large */}
            <Text className="text-xl font-extrabold text-rose-500">
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
