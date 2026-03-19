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
  const { branches, selectedBranch, setSelectedBranch, loadBranches } = useBranch();
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
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "paid");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  const header = (
    <>
      {/* Top header — deep blue with store info */}
      <View className="bg-[#3B55D5] px-5 pb-5 pt-14 dark:bg-[#2A3BAF]">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-[#BFCEFF]">
              Quinn&apos;s Laundry
            </Text>
            <Text className="mt-0.5 text-2xl font-bold text-white">
              Dashboard
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-xs text-[#BFCEFF]">{today}</Text>
              {selectedBranch ? (
                <>
                  <Text className="text-xs text-[#BFCEFF]">·</Text>
                  <Text className="text-xs font-semibold text-white">
                    {selectedBranch.name}
                  </Text>
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

      {/* Branch picker modal */}
      <Modal
        visible={branchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setBranchModalVisible(false)}
        >
          <View
            className="mx-4 mt-28 rounded-3xl bg-white p-5 dark:bg-[#1C1E38]"
            style={{
              shadowColor: '#1A1F3C',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text className="mb-4 text-base font-bold text-[#1A1F3C] dark:text-white">
              Select Branch
            </Text>

            {branches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                onPress={() => { setSelectedBranch(branch); setBranchModalVisible(false); }}
                className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${selectedBranch?.id === branch.id ? 'bg-[#3B55D5]' : 'bg-[#ECEEFF] dark:bg-[#252845]'}`}
              >
                <Text className={`font-semibold ${selectedBranch?.id === branch.id ? 'text-white' : 'text-[#1A1F3C] dark:text-[#C8CCF0]'}`}>
                  {branch.name}
                </Text>
                {selectedBranch?.id === branch.id && (
                  <View className="h-2 w-2 rounded-full bg-white/80" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Stat cards */}
      {loading ? (
        <View className="px-5 py-8">
          <Text className="text-sm text-[#8A8FA8]">Loading...</Text>
        </View>
      ) : (
        <View className="gap-3 px-5 py-5">
          {/* Featured card — Net Sales */}
          <StatCard color="default" label="Net Sales" value={fmt(summary?.netSales ?? 0)} />

          {/* Row — Gross Profit + Expenses */}
          <View className="flex-row gap-3">
            <StatCard color="emerald" label="Gross Profit" value={fmt(summary?.grossProfit ?? 0)} />
            <StatCard color="amber" label="Expenses" value={fmt(totalExpenses)} />
          </View>
        </View>
      )}

      {/* Section header */}
      {!loading && (
        <View className="mx-5 mb-2 mt-1 flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-widest text-[#8A8FA8]">
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
      className="flex-1 bg-white dark:bg-[#12142A]"
      data={loading ? [] : unpaidOrders}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/order/${item.id}`)}
          activeOpacity={0.75}
          className="mx-5 mb-3 overflow-hidden rounded-2xl bg-white dark:bg-[#1C1E38]"
          style={{
            shadowColor: '#1A1F3C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          {/* Top accent line */}
          <View className="h-0.5 w-full bg-rose-400" />

          <View className="flex-row items-center px-4 py-4">
            {/* Left: name + meta */}
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-[#1A1F3C] dark:text-white" numberOfLines={1}>
                {item.customer.nickname}
              </Text>

              <View className="mt-1.5 flex-row items-center gap-2">
                <Text className="text-xs text-[#8A8FA8]">
                  #{item.orderNumber}
                </Text>
                <View className="rounded-full bg-[#ECEEFF] px-2 py-0.5 dark:bg-[#252845]">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-[#5A5E7A] dark:text-[#9098C0]">
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

            {/* Right: amount */}
            <Text className="text-lg font-extrabold text-rose-500">
              {fmt(Number(item.total))}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        loading ? null : (
          <View className="items-center px-4 py-12">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#1C1E38]">
              <IconSymbol name="checkmark.circle.fill" size={32} color="#3B55D5" />
            </View>
            <Text className="text-sm font-semibold text-[#5A5E7A] dark:text-[#9098C0]">
              All orders are settled!
            </Text>
          </View>
        )
      }
      ListFooterComponent={<View className="h-8" />}
    />
  );
}
