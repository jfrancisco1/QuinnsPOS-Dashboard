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

export default function OrdersScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
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
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    <View className="flex-1 bg-white dark:bg-page-dark">
      {/* Header */}
      <View
        className="bg-white px-5 pb-4 pt-14 dark:bg-card-dark"
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
            <Text className="text-2xl font-bold text-ink dark:text-white">Orders</Text>
            {selectedBranch ? (
              <Text className="mt-0.5 text-xs font-semibold text-subtle dark:text-muted-dark">
                {selectedBranch.name}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="rounded-2xl bg-chip p-2.5 dark:bg-chip-dark"
          >
            <IconSymbol name="storefront.fill" size={20} color="#3B55D5" />
          </TouchableOpacity>
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
              <Text className="text-sm text-muted">No orders yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
