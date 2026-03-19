import { useCallback, useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ListItem } from "@/components/ui/list-item";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
  const { branches, selectedBranch, setSelectedBranch, loadBranches } = useBranch();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getOrders(token), loadBranches(token)]).then(([result]) => {
        if (result.ok) {
          const sorted = [...result.data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setAllOrders(sorted);
        }
        setLoading(false);
      });
    }, [token, loadBranches]),
  );

  const orders = selectedBranch
    ? allOrders.filter((o) => o.branch?.id === selectedBranch.id)
    : allOrders;

  return (
    <View className="flex-1 bg-white dark:bg-[#12142A]">
      {/* Header */}
      <View
        className="bg-white px-5 pb-4 pt-14 dark:bg-[#1C1E38]"
        style={{
          shadowColor: '#1A1F3C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-[#1A1F3C] dark:text-white">
              Orders
            </Text>
            {selectedBranch ? (
              <Text className="mt-0.5 text-xs font-semibold text-[#5A5E7A] dark:text-[#9098C0]">
                {selectedBranch.name}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="rounded-2xl bg-[#ECEEFF] p-2.5 dark:bg-[#252845]"
          >
            <IconSymbol name="storefront.fill" size={20} color="#3B55D5" />
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
                onPress={() => {
                  setSelectedBranch(branch);
                  setBranchModalVisible(false);
                }}
                className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                  selectedBranch?.id === branch.id
                    ? 'bg-[#3B55D5]'
                    : 'bg-[#ECEEFF] dark:bg-[#252845]'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    selectedBranch?.id === branch.id
                      ? 'text-white'
                      : 'text-[#1A1F3C] dark:text-[#C8CCF0]'
                  }`}
                >
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
