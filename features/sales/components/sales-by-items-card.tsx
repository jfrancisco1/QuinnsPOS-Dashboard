import { Text, View } from "react-native";
import { useColorScheme } from "nativewind";

import { Card } from "@/components/ui/card";
import { ItemShapeSwatch } from "@/features/catalog/components/item-shape-swatch";
import { fmtPeso } from "@/features/sales/utils";
import { type Item, type SalesByItem } from "@/lib/api";

type Props = {
  salesByItem: SalesByItem[];
  itemsMap: Map<number, Item>;
};

export function SalesByItemsCard({ salesByItem, itemsMap }: Props) {
  const { colorScheme } = useColorScheme();
  const amountColor = colorScheme === 'dark' ? '#B060FF' : '#560591';
  if (salesByItem.length === 0) return null;

  return (
    <Card title="Sales by Items">
      {salesByItem.map((row, i) => {
        const item = itemsMap.get(Number(row.item_id));
        const color = row.color ?? item?.color ?? null;
        const shape = row.shape ?? item?.shape ?? null;
        return (
          <View key={`${row.item_id}-${i}`}>
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
                  <Text className="mt-0.5 text-xs text-muted">
                    {row.category} · ×{row.qty.toString()}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold" style={{ color: amountColor }}>
                {fmtPeso(row.net_sales)}
              </Text>
            </View>
            {i < salesByItem.length - 1 && (
              <View className="h-px bg-divide dark:bg-divide-dark" />
            )}
          </View>
        );
      })}
    </Card>
  );
}
