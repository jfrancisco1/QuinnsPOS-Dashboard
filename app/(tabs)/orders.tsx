import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { BranchPicker } from "@/components/ui/branch-picker";
import { ListItem } from "@/components/ui/list-item";
import { useAuth } from "@/context/auth-context";
import { useBranch } from "@/context/branch-context";
import { getOrders, type Order } from "@/lib/api";

function paymentVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case "paid":
      return "success";
    case "unpaid":
      return "danger";
    case "partial":
      return "warning";
    default:
      return "default";
  }
}

export default function OrdersScreen() {
  const { token } = useAuth();
  const { selectedBranch, syncBranchesFromOrders } = useBranch();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      getOrders(token).then((result) => {
        if (result.ok) {
          const sorted = [...result.data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setAllOrders(sorted);
          syncBranchesFromOrders(result.data);
        }
        setLoading(false);
      });
    }, [token, syncBranchesFromOrders]),
  );

  const orders = selectedBranch
    ? allOrders.filter((o) => o.branch?.id === selectedBranch.id)
    : allOrders;

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      <View className="px-4 pb-4 pt-14">
        <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
          Orders
        </Text>
      </View>

      <BranchPicker />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading...
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListItem
              title={`#${item.orderNumber}  ·  ${item.customer?.nickname ?? "Unknown"}`}
              subtitle={`₱${Number(item.total).toFixed(2)}  ·  ${new Date(item.createdAt).toLocaleDateString()}`}
              right={
                <Badge
                  label={item.paymentStatus}
                  variant={paymentVariant(item.paymentStatus)}
                />
              }
              onPress={() => router.push(`/order/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                No orders yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
