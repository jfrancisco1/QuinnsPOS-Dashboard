import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { getOrderByNumber, type Order } from '@/lib/api';

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

function statusVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}

export default function OrderDetailScreen() {
  const { token } = useAuth();
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !orderNumber) return;
    getOrderByNumber(token, orderNumber).then(result => {
      if (result.ok) setOrder(result.data);
      setLoading(false);
    });
  }, [token, orderNumber]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <View className="gap-4 p-4">
        {/* Header card */}
        <View className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <View className="mb-3 flex-row items-start justify-between">
            <Text className="text-xl font-bold text-zinc-900 dark:text-white">
              #{order.orderNumber}
            </Text>
            <View className="items-end gap-1">
              <Badge label={order.paymentStatus} variant={paymentVariant(order.paymentStatus)} />
              <Badge label={order.orderStatus} variant={statusVariant(order.orderStatus)} />
            </View>
          </View>
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            Customer: {order.customer?.nickname ?? '—'}
          </Text>
          <Text className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            Type: {order.fulfillmentType}
          </Text>
          <Text className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            Date: {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>

        {/* Items card */}
        <View className="rounded-xl bg-white dark:bg-zinc-900">
          <Text className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-white">
            Items
          </Text>
          {(order.items ?? []).length === 0 ? (
            <Text className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">No items</Text>
          ) : (
            (order.items ?? []).map((item, i) => (
              <View
                key={i}
                className="flex-row items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800"
              >
                <View className="flex-1">
                  <Text className="text-sm text-zinc-900 dark:text-white">{item.name}</Text>
                  {(item.quantity ?? 1) > 1 && (
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">×{item.quantity}</Text>
                  )}
                </View>
                <Text className="text-sm font-medium text-zinc-900 dark:text-white">
                  ₱{(Number(item.price) * (item.quantity ?? 1)).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Totals card */}
        <View className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <View className="flex-row justify-between py-1">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">Subtotal</Text>
            <Text className="text-sm text-zinc-900 dark:text-white">
              ₱{Number(order.subtotal).toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">Delivery Fee</Text>
            <Text className="text-sm text-zinc-900 dark:text-white">
              ₱{Number(order.deliveryFee).toFixed(2)}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Text className="text-sm font-bold text-zinc-900 dark:text-white">Total</Text>
            <Text className="text-base font-bold text-zinc-900 dark:text-white">
              ₱{Number(order.total).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
