import { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { ListItem } from '@/components/ui/list-item';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { useOrders } from '@/features/orders/hooks/use-orders';
import { paymentVariant } from '@/features/orders/utils';

export default function OrdersScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const { orders, loading, statusTab, setStatusTab, STATUS_TABS } = useOrders({
    token,
    selectedBranch,
    loadBranches,
  });

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader
        title="Orders"
        subtitle={selectedBranch?.name}
        onBranchPress={() => setBranchModalVisible(true)}
      >
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
                <Text
                  className={`text-sm font-semibold ${active ? 'text-primary' : 'text-white'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScreenHeader>

      <BranchPickerModal
        visible={branchModalVisible}
        onClose={() => setBranchModalVisible(false)}
      />

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
                <Badge label={item.paymentStatus} variant={paymentVariant(item.paymentStatus)} />
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
