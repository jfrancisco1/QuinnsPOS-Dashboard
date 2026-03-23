import { Text, TouchableOpacity } from 'react-native';

import { router } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { type Category } from '@/lib/api';

export type CategoryCardProps = {
  cat: Category;
};

export function CategoryCard({ cat }: CategoryCardProps) {
  function openEdit() {
    router.push({
      pathname: '/edit-category',
      params: {
        id: String(cat.id),
        name: cat.name,
        is_active: cat.is_active ? '1' : '0',
        sort_order: String(cat.sort_order ?? 0),
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={openEdit}
      activeOpacity={0.75}
      className="flex-row items-center border-b border-divide py-3.5 dark:border-divide-dark"
    >
      <Text className="flex-1 text-sm font-medium text-ink dark:text-white" numberOfLines={1}>
        {cat.name}
      </Text>
      {!cat.is_active && <Badge label="Inactive" variant="warning" />}
    </TouchableOpacity>
  );
}
