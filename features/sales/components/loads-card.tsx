import { Text, View } from "react-native";
import { useColorScheme } from "nativewind";

import { Card } from "@/components/ui/card";
import { ItemShapeSwatch } from "@/features/catalog/components/item-shape-swatch";
import { type Item, type LoadsBreakdownRow } from "@/lib/api";

type Props = {
  totalLoads: number;
  orderCount: number;
  breakdown: LoadsBreakdownRow[];
  itemsMap: Map<number, Item>;
};

export function LoadsCard({ totalLoads, orderCount, breakdown, itemsMap }: Props) {
  const { colorScheme } = useColorScheme();
  const amountColor = colorScheme === 'dark' ? '#B060FF' : '#560591';

  return (
    <Card title="Loads">
      <Text className="-mt-2 mb-2.5 text-xs text-muted">All orders</Text>

      <View className="items-center py-2">
        <Text className="text-4xl font-bold" style={{ color: amountColor }}>
          {totalLoads.toString()}
        </Text>
        <Text className="mt-1 text-xs text-muted">
          across {orderCount} order{orderCount !== 1 ? "s" : ""}
        </Text>
      </View>

      {breakdown.length > 0 && (
        <View className="mt-2 border-t border-divide pt-1 dark:border-divide-dark">
          {breakdown.map((row, i) => {
            const item = itemsMap.get(Number(row.itemId));
            const color = item?.color ?? null;
            const shape = item?.shape ?? null;
            return (
              <View key={`${row.itemId}-${i}`}>
                <View className="flex-row items-center justify-between py-2.5">
                  <View className="flex-1 flex-row items-center gap-2">
                    {color && shape && (
                      <View
                        className="h-9 w-9 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: color + "1A" }}
                      >
                        <ItemShapeSwatch color={color} shape={shape} />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-ink dark:text-white">
                        {row.label}
                      </Text>
                      {item?.category?.name && (
                        <Text className="mt-0.5 text-xs text-muted">{item.category.name}</Text>
                      )}
                    </View>
                  </View>
                  <Text className="text-sm font-bold" style={{ color: amountColor }}>
                    ×{row.qty.toString()}
                  </Text>
                </View>
                {i < breakdown.length - 1 && (
                  <View className="h-px bg-divide dark:bg-divide-dark" />
                )}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
