import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListItem } from '@/components/ui/list-item';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { getOrders, type Order } from '@/lib/api';

function paymentVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'unpaid':
      return 'danger';
    case 'partial':
      return 'warning';
    default:
      return 'default';
  }
}

const STATUS_TABS = ['All', 'Paid', 'Unpaid', 'Partial'];

export default function OrdersScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [statusTab, setStatusTab] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getOrders(token), loadBranches(token)]).then(([result]) => {
        if (result.ok) {
          const sorted = [...result.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setAllOrders(sorted);
        }
        setLoading(false);
      });
    }, [token, loadBranches]),
  );

  const branchFiltered = selectedBranch
    ? allOrders.filter((o) => o.branch?.id === selectedBranch.id)
    : allOrders;

  const orders =
    statusTab === 0
      ? branchFiltered
      : branchFiltered.filter(
          (o) => o.paymentStatus?.toLowerCase() === STATUS_TABS[statusTab].toLowerCase(),
        );

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      {/* Header */}
      <View className="bg-primary px-5 pb-5 pt-14 dark:bg-primary-700">
        {/* Title row */}
        <View className="flex-row items-center">
          <View className="absolute left-0 right-0 items-center">
            <Text className="text-xl font-bold text-white">Orders</Text>
            {selectedBranch ? (
              <Text className="text-xs font-semibold text-primary-100" numberOfLines={1}>
                {selectedBranch.name}
              </Text>
            ) : (
              <Text className="text-xs text-primary-200">All Branches</Text>
            )}
          </View>
          <View className="flex-1" />
          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
          >
            <IconSymbol name="storefront.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Status filter tabs */}
        <View className="mt-3 flex-row gap-2">
          {STATUS_TABS.map((label, index) => {
            const active = statusTab === index;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setStatusTab(index)}
                activeOpacity={0.75}
                className={`flex-1 items-center rounded-full py-1.5 ${active ? 'bg-white' : 'bg-white/20'}`}
              >
                <Text className={`text-sm font-semibold ${active ? 'text-primary' : 'text-white'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <BranchPickerModal visible={branchModalVisible} onClose={() => setBranchModalVisible(false)} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListItem
              title={`#${item.orderNumber}  ·  ${item.customer?.nickname ?? 'Unknown'}`}
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
              <Text className="text-sm text-muted">No orders found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
