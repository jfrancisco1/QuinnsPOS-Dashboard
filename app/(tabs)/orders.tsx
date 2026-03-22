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
import { fulfillmentLabel, paymentLabel, paymentVariant, statusLabel, statusVariant } from '@/features/orders/utils';
import { PeriodPickerModal } from '@/features/sales/components/period-picker-modal';

export default function OrdersScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  const {
    orders,
    loading,
    statusTab,
    setStatusTab,
    STATUS_TABS,
    period,
    setOffset,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  } = useOrders({ token, selectedBranch, loadBranches });

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader
        title="Orders"
        subtitle={selectedBranch?.name}
        onBranchPress={() => setBranchModalVisible(true)}
      >
        <View className="mt-3 flex-row items-center">
          <TouchableOpacity
            onPress={() => setOffset((o) => o - 1)}
            disabled={!canGoBack}
            activeOpacity={0.5}
            className={`h-8 w-8 items-center justify-center ${!canGoBack ? 'opacity-30' : ''}`}
          >
            <Text className="text-2xl font-bold text-white">‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodModalVisible(true)}
            activeOpacity={0.8}
            className="mx-2 flex-1 items-center rounded-full bg-white/20 py-1.5"
          >
            <Text className="text-sm font-semibold text-white" numberOfLines={1}>
              {periodLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOffset((o) => o + 1)}
            disabled={!canGoForward}
            activeOpacity={0.5}
            className={`h-8 w-8 items-center justify-center ${!canGoForward ? 'opacity-30' : ''}`}
          >
            <Text className="text-2xl font-bold text-white">›</Text>
          </TouchableOpacity>
        </View>

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

      <PeriodPickerModal
        visible={periodModalVisible}
        period={period}
        onClose={() => setPeriodModalVisible(false)}
        onSelect={(key) => {
          setPeriodModalVisible(false);
          handlePeriodSelect(key);
        }}
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
              title={item.customer?.nickname ?? 'Unknown'}
              subtitle={`${new Date(item.createdAt).toLocaleDateString()}  ·  ${fulfillmentLabel(item.fulfillmentType)}`}
              description={item.customer?.address ?? undefined}
              right={
                <View className="items-end gap-1">
                  <Text className="text-base font-bold text-zinc-900 dark:text-white">
                    ₱{Number(item.total).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <View className="flex-row gap-1">
                    <Badge label={statusLabel(item.orderStatus)} variant={statusVariant(item.orderStatus)} />
                    <Badge label={paymentLabel(item.paymentStatus)} variant={paymentVariant(item.paymentStatus)} />
                  </View>
                </View>
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
