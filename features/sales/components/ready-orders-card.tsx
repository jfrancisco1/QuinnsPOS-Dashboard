import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";

import { router } from "expo-router";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fulfillmentLabel } from "@/features/orders/utils";
import { fmtPeso } from "@/features/sales/utils";
import { type ReadyOrdersSummary } from "@/lib/api";

const COLLAPSED_ROWS = 5;

type Props = {
  readyOrders: ReadyOrdersSummary | null;
};

function waitingLabel(days: number): string {
  if (days === 0) return "Ready today";
  return `Waiting ${days} day${days !== 1 ? "s" : ""}`;
}

export function ReadyOrdersCard({ readyOrders }: Props) {
  const { colorScheme } = useColorScheme();
  const [expanded, setExpanded] = useState(false);
  const amountColor = colorScheme === "dark" ? "#B060FF" : "#560591";
  const overdueColor = colorScheme === "dark" ? "#FCA5A5" : "#DC2626";

  if (readyOrders == null) return null;

  const { readyOrders: count, overdueOrders, overdueAfterDays, byFulfillment, orders } = readyOrders;
  const forPickup = byFulfillment.walk_in ?? 0;
  const forDelivery = count - forPickup;
  const visible = expanded ? orders : orders.slice(0, COLLAPSED_ROWS);

  return (
    <Card title="Ready for Pickup">
      <Text className="-mt-2 mb-2.5 text-xs text-muted">Right now, any date</Text>

      <View className="items-center py-2">
        <Text className="text-4xl font-bold" style={{ color: amountColor }}>
          {count.toString()}
        </Text>
        <Text className="mt-1 text-xs text-muted">
          {count === 0
            ? "Nothing waiting"
            : `${forPickup} for pickup · ${forDelivery} for delivery`}
        </Text>
        {overdueOrders > 0 && (
          <Text className="mt-1.5 text-xs font-semibold" style={{ color: overdueColor }}>
            {overdueOrders} waiting {overdueAfterDays}+ days
          </Text>
        )}
      </View>

      {visible.length > 0 && (
        <View className="mt-2 border-t border-divide pt-1 dark:border-divide-dark">
          {visible.map((order, i) => {
            const overdue = order.daysWaiting >= overdueAfterDays;
            return (
              <View key={order.orderNumber}>
                <TouchableOpacity
                  onPress={() => router.push(`/order/${order.orderNumber}`)}
                  activeOpacity={0.6}
                  className="flex-row items-center justify-between py-2.5"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-semibold text-ink dark:text-white" numberOfLines={1}>
                      {order.customer?.nickname ?? "Deleted customer"}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted">
                      {fulfillmentLabel(order.fulfillmentType)} ·{" "}
                      <Text style={overdue ? { color: overdueColor, fontWeight: "600" } : undefined}>
                        {waitingLabel(order.daysWaiting)}
                      </Text>
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-bold" style={{ color: amountColor }}>
                      {fmtPeso(order.total)}
                    </Text>
                    {order.paymentStatus === "unpaid" && <Badge label="Unpaid" variant="danger" />}
                  </View>
                </TouchableOpacity>
                {i < visible.length - 1 && <View className="h-px bg-divide dark:bg-divide-dark" />}
              </View>
            );
          })}

          {orders.length > COLLAPSED_ROWS && (
            <TouchableOpacity onPress={() => setExpanded((e) => !e)} activeOpacity={0.6} className="pt-3">
              <Text className="text-center text-sm font-semibold" style={{ color: amountColor }}>
                {expanded ? "Show less" : `Show all ${orders.length}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
}
