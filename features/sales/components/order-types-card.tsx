import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useColorScheme } from "nativewind";

import { Card } from "@/components/ui/card";

type McIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type Props = {
  // Order counts keyed by normalized fulfillmentType (e.g. 'walk_in', 'pickup_deliver').
  ordersByFulfillment: Record<string, number>;
};

type TypeRow = { label: string; icon: McIcon; color: string; count: number };

function isWalkIn(fulfillment: string): boolean {
  return fulfillment.startsWith("walk");
}

export function OrderTypesCard({ ordersByFulfillment }: Props) {
  const { colorScheme } = useColorScheme();
  const amountColor = colorScheme === "dark" ? "#B060FF" : "#560591";

  // Everything that isn't walk-in (pickup-deliver, plus legacy pickup/delivery values)
  // goes in Pickup & Delivery, so the two tiles always add up to the total order count.
  let walkIn = 0;
  let pickupDelivery = 0;
  for (const [fulfillment, count] of Object.entries(ordersByFulfillment)) {
    if (isWalkIn(fulfillment)) walkIn += count;
    else pickupDelivery += count;
  }

  const rows: TypeRow[] = [
    { label: "Pickup & Delivery", icon: "truck-delivery-outline", color: "#0070FF", count: pickupDelivery },
    { label: "Walk-in", icon: "walk", color: "#22C55E", count: walkIn },
  ];

  return (
    <Card title="Order Types">
      <Text className="-mt-2 mb-2.5 text-xs text-muted">All orders</Text>

      <View className="flex-row gap-3">
        {rows.map((row) => (
          <View
            key={row.label}
            className="flex-1 items-center rounded-2xl bg-page py-3 dark:bg-page-dark"
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: row.color + "1A" }}
            >
              <MaterialCommunityIcons name={row.icon} size={20} color={row.color} />
            </View>
            <Text className="mt-2 text-2xl font-bold" style={{ color: amountColor }}>
              {row.count.toString()}
            </Text>
            <Text className="mt-0.5 text-xs text-muted">
              {row.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
