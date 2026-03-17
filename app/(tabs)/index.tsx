import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { ListItem } from "@/components/ui/list-item";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/context/auth-context";
import { getExpenses, getOrders, type Expense, type Order } from "@/lib/api";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getOrders(token), getExpenses(token)]).then(
        ([ordRes, expRes]) => {
          if (ordRes.ok) setOrders(ordRes.data);
          if (expRes.ok) setExpenses(expRes.data);
          setLoading(false);
        },
      );
    }, [token]),
  );

  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const todayExpenses = expenses.filter((e) => isToday(e.expense_date));
  const netSales = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalExpenses = todayExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const grossProfit = netSales - totalExpenses;
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "paid");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const header = (
    <>
      <View className="px-4 pb-4 pt-14">
        <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
          Dashboard
        </Text>
        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {today}
        </Text>
      </View>

      {loading ? (
        <View className="px-4">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading...
          </Text>
        </View>
      ) : (
        <View className="gap-3 px-4 pb-4">
          <View className="flex-row gap-3">
            <StatCard label="Net Sales" value={fmt(netSales)} />
            <StatCard label="Gross Profit" value={fmt(grossProfit)} />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              label="Today's Orders"
              value={String(todayOrders.length)}
            />
            <StatCard label="Today's Expenses" value={fmt(totalExpenses)} />
          </View>
        </View>
      )}

      {!loading && (
        <Text className="px-4 pb-2 pt-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Unpaid Orders
        </Text>
      )}
    </>
  );

  return (
    <FlatList
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      data={loading ? [] : unpaidOrders}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <ListItem
          title={`#${item.orderNumber} — ${item.customer.nickname}`}
          subtitle={item.fulfillmentType}
          right={
            <Text className="text-sm font-semibold text-zinc-900 dark:text-white">
              {fmt(Number(item.total))}
            </Text>
          }
          onPress={() => router.push(`/order/${item.orderNumber}`)}
        />
      )}
      ListEmptyComponent={
        loading ? null : (
          <View className="px-4 py-6">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              No unpaid orders
            </Text>
          </View>
        )
      }
      ListFooterComponent={<View className="h-8" />}
    />
  );
}
