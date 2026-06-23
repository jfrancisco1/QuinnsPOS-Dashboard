import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { useAuth } from '@/context/auth-context';
import { fulfillmentLabel, paymentLabel, paymentVariant, statusLabel, statusVariant } from '@/features/orders/utils';
import { getOrderByNumber, updateOrderPaymentStatus, updateOrderStatus, type Order, type OrderStatus, type OrderStatusHistoryEntry, type PaymentHistoryEntry, type PaymentStatus } from '@/lib/api';

function HistoryCard({
  title,
  entries,
  formatStatus,
}: {
  title: string;
  entries: (PaymentHistoryEntry | OrderStatusHistoryEntry)[];
  formatStatus: (s: string) => string;
}) {
  return (
    <View className="rounded-xl bg-white dark:bg-zinc-900">
      <Text className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-white">
        {title}
      </Text>
      {[...entries]
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
        .map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <View key={i} className="flex-row px-4 py-3">
            {/* Timeline indicator */}
            <View className="mr-3 items-center">
              <View className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />
              {!isLast && <View className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />}
            </View>
            {/* Content */}
            <View className="flex-1 pb-1">
              <Text className="text-sm font-medium text-zinc-900 dark:text-white">
                {formatStatus(entry.fromStatus)} → {formatStatus(entry.toStatus)}
              </Text>
              <Text className="mt-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {new Date(entry.changedAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </Text>
              {entry.updatedBy && (
                <Text className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                  by {entry.updatedBy.name}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { token } = useAuth();
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!token || !orderNumber) return;
    getOrderByNumber(token, orderNumber).then((result) => {
      if (result.ok) setOrder(result.data);
      setLoading(false);
    });
  }, [token, orderNumber]);

  async function handleOrderStatusChange(status: OrderStatus) {
    if (!token || !order || status === order.orderStatus || updatingStatus) return;
    setStatusModalVisible(false);
    setUpdatingStatus(true);
    const result = await updateOrderStatus(token, order.orderNumber, status);
    if (result.ok) {
      setOrder(result.data);
      setToast({ message: 'Order status updated', variant: 'success' });
    } else {
      setToast({ message: result.error.message, variant: 'error' });
    }
    setUpdatingStatus(false);
  }

  async function handlePaymentStatusChange(status: PaymentStatus) {
    if (!token || !order || status === order.paymentStatus || updatingPayment) return;
    setPaymentModalVisible(false);
    setUpdatingPayment(true);
    const result = await updateOrderPaymentStatus(token, order.orderNumber, status);
    if (result.ok) {
      setOrder(result.data);
      setToast({ message: 'Payment status updated', variant: 'success' });
    } else {
      setToast({ message: result.error.message, variant: 'error' });
    }
    setUpdatingPayment(false);
  }

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
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          {/* Header card */}
          <View className="rounded-xl bg-white p-4 dark:bg-zinc-900">
            <View className="mb-3 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-bold text-zinc-900 dark:text-white" numberOfLines={1}>
                  {order.customer?.nickname?.toUpperCase() ?? '—'}
                </Text>
                <Text className="mt-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {fulfillmentLabel(order.fulfillmentType)}
                </Text>
              </View>
              <View className="items-end gap-1">
                <Badge label={paymentLabel(order.paymentStatus)} variant={paymentVariant(order.paymentStatus)} />
                <Badge label={statusLabel(order.orderStatus)} variant={statusVariant(order.orderStatus)} />
              </View>
            </View>
            <Text className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {new Date(order.createdAt).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </Text>
            <Text className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              {order.branch?.name ?? '—'}
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
                    <Text className="text-sm text-zinc-900 dark:text-white">{item.label}</Text>
                    {item.qty > 1 && (
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">×{item.qty}</Text>
                    )}
                  </View>
                  <Text className="text-sm font-medium text-zinc-900 dark:text-white">
                    ₱{(Number(item.price) * item.qty).toFixed(2)}
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
              <Text className="text-base font-bold text-zinc-900 dark:text-white">Total</Text>
              <Text className="text-xl font-bold text-zinc-900 dark:text-white">
                ₱{Number(order.total).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Order status history */}
          {(order.orderStatusHistory ?? []).length > 0 && (
            <HistoryCard
              title="Status History"
              entries={order.orderStatusHistory!}
              formatStatus={statusLabel}
            />
          )}

          {/* Payment history */}
          {(order.paymentHistory ?? []).length > 0 && (
            <HistoryCard
              title="Payment History"
              entries={order.paymentHistory!}
              formatStatus={paymentLabel}
            />
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View className="border-t border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setStatusModalVisible(true)}
            disabled={updatingStatus}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-zinc-200 py-4 active:opacity-70 dark:bg-zinc-700"
          >
            {updatingStatus && <ActivityIndicator size="small" color="#18181b" />}
            <Text className="text-base font-semibold text-zinc-900 dark:text-white">
              {updatingStatus ? 'Updating…' : 'Order Status'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPaymentModalVisible(true)}
            disabled={updatingPayment}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:bg-primary-700"
          >
            {updatingPayment && <ActivityIndicator size="small" color="white" />}
            <Text className="text-base font-semibold text-white">
              {updatingPayment ? 'Updating…' : 'Payment Status'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Toast notifier */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible={!!toast}
          onHide={() => setToast(null)}
        />
      )}

      {/* Order status modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-end bg-black/40"
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View
            className="rounded-t-3xl bg-white p-5 dark:bg-zinc-900"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text className="mb-4 text-base font-bold text-zinc-900 dark:text-white">
              Select Order Status
            </Text>
            {(
              [
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'ready', label: 'Ready' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ] as { value: OrderStatus; label: string }[]
            ).map(({ value, label }) => {
              const isActive = order.orderStatus === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleOrderStatusChange(value)}
                  className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                    isActive ? 'bg-primary' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      isActive ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {label}
                  </Text>
                  {isActive && <View className="h-2 w-2 rounded-full bg-white/80" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment status modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-end bg-black/40"
          activeOpacity={1}
          onPress={() => setPaymentModalVisible(false)}
        >
          <View
            className="rounded-t-3xl bg-white p-5 dark:bg-zinc-900"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text className="mb-4 text-base font-bold text-zinc-900 dark:text-white">
              Select Payment Status
            </Text>
            {(
              [
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'paid_cash', label: 'Cash' },
                { value: 'paid_gcash', label: 'GCash' },
                { value: 'paid_bank', label: 'Bank' },
                { value: 'paid_others', label: 'Others' },
              ] as { value: PaymentStatus; label: string }[]
            ).map(({ value, label }) => {
              const isActive = order.paymentStatus === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => handlePaymentStatusChange(value)}
                  className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                    isActive ? 'bg-primary' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      isActive ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {label}
                  </Text>
                  {isActive && <View className="h-2 w-2 rounded-full bg-white/80" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
