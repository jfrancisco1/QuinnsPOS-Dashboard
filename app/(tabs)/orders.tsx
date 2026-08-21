import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { Order } from "@/lib/api";

import { router } from "expo-router";

import { Badge } from "@/components/ui/badge";
import { BranchPickerModal } from "@/components/ui/branch-picker-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ListItem } from "@/components/ui/list-item";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuth } from "@/context/auth-context";
import { useBranch } from "@/context/branch-context";
import { useOrders } from "@/features/orders/hooks/use-orders";
import {
  fulfillmentLabel,
  paymentLabel,
  paymentVariant,
  statusLabel,
  statusVariant,
} from "@/features/orders/utils";
import { PeriodPickerModal } from "@/features/sales/components/period-picker-modal";
import { fmtPeso } from "@/features/sales/utils";

export default function OrdersScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  const {
    orders,
    loading,
    loadingMore,
    loadMore,
    statusTab,
    setStatusTab,
    STATUS_TABS,
    period,
    setOffset,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
    searchQuery,
    setSearchQuery,
    unpaidTotal,
    unpaidCount,
  } = useOrders({ token, selectedBranch, loadBranches });

  const sections = useMemo(
    () =>
      orders.reduce<{ title: string; data: Order[] }[]>((acc, order) => {
        const label = new Date(order.createdAt).toLocaleDateString("en-PH", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const existing = acc.find((s) => s.title === label);
        if (existing) {
          existing.data.push(order);
        } else {
          acc.push({ title: label, data: [order] });
        }
        return acc;
      }, []),
    [orders],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View className="border-b border-divide bg-page px-4 py-2 dark:border-divide-dark dark:bg-page-dark">
        <Text className="text-sm font-bold text-emerald">
          {section.title}
        </Text>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <ListItem
        title={(item.customer?.nickname ?? "Unknown").toUpperCase()}
        subtitle={`${fulfillmentLabel(item.fulfillmentType)}`}
        description={item.customer?.address ?? undefined}
        right={
          <View className="items-end gap-1">
            <Text className="text-base font-bold text-zinc-900 dark:text-white">
              ₱
              {Number(item.total).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <View className="flex-row gap-1">
              <Badge
                label={statusLabel(item.orderStatus)}
                variant={statusVariant(item.orderStatus)}
              />
              <Badge
                label={paymentLabel(item.paymentStatus)}
                variant={paymentVariant(item.paymentStatus)}
              />
            </View>
          </View>
        }
        onPress={() => router.push(`/order/${item.orderNumber}`)}
      />
    ),
    [],
  );

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
            className={`h-8 w-8 items-center justify-center ${!canGoBack ? "opacity-30" : ""}`}
          >
            <Text className="text-2xl font-bold text-white">‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodModalVisible(true)}
            activeOpacity={0.8}
            className="mx-2 flex-1 items-center rounded-full bg-white/20 py-1.5"
          >
            <Text
              className="text-sm font-semibold text-white"
              numberOfLines={1}
            >
              {periodLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOffset((o) => o + 1)}
            disabled={!canGoForward}
            activeOpacity={0.5}
            className={`h-8 w-8 items-center justify-center ${!canGoForward ? "opacity-30" : ""}`}
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
                className={`flex-1 items-center rounded-full py-1.5 ${active ? "bg-white" : "bg-white/20"}`}
              >
                <Text
                  className={`text-sm font-semibold ${active ? "text-primary" : "text-white"}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {unpaidCount > 0 && (
          <View className="mt-3 flex-row items-center justify-center gap-1.5 rounded-full bg-white/20 py-1.5">
            <Text className="text-xs font-semibold text-white">
              Unpaid: {fmtPeso(unpaidTotal)} · {unpaidCount} order{unpaidCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
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

      <View className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <View className="flex-row items-center rounded-lg bg-zinc-100 px-3 dark:bg-zinc-800">
          <IconSymbol name="magnifyingglass" size={16} color="#71717a" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by customer name..."
            placeholderTextColor="#71717a"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="flex-1 py-2.5 pl-2 text-sm text-zinc-900 dark:text-white"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <IconSymbol name="xmark.circle.fill" size={16} color="#71717a" />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.orderNumber}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-muted">No orders found</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-4">
                <Text className="text-sm text-muted">Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
