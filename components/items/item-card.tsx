import { Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { ItemShapeSwatch } from '@/components/items/item-shape-swatch';
import { type Item } from '@/lib/api';

export type ItemCardProps = {
  item: Item;
};

export function ItemCard({ item }: ItemCardProps) {
  function openEdit() {
    router.push({
      pathname: '/edit-item',
      params: {
        id: String(item.id),
        name: item.name,
        price: String(item.price),
        cost: String(item.cost),
        description: item.description ?? '',
        is_active: item.is_active ? '1' : '0',
        category_id: String(item.category?.id ?? ''),
        color: item.color ?? '',
        shape: item.shape ?? '',
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={openEdit}
      activeOpacity={0.75}
      className="m-1.5 flex-1 overflow-hidden rounded-2xl bg-white dark:bg-card-dark"
      style={{
        shadowColor: '#1A1F3C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="p-3">
        <View className="flex-row items-start justify-between">
          <Text
            className="flex-1 text-sm font-semibold text-ink dark:text-white"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.color && item.shape ? (
            <View className="ml-1.5 mt-0.5">
              <ItemShapeSwatch color={item.color} shape={item.shape} />
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 text-xs text-muted dark:text-subtle" numberOfLines={1}>
          {item.category?.name ?? '—'}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-ink dark:text-white">
            ₱{Number(item.price).toFixed(2)}
          </Text>
          {!item.is_active && <Badge label="Inactive" variant="warning" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}
