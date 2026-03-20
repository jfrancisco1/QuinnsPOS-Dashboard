import { Text, TouchableOpacity, View } from 'react-native';

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
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={openEdit}
      activeOpacity={0.75}
      className="m-1.5 flex-1 rounded-2xl bg-white p-4 dark:bg-card-dark"
      style={{
        shadowColor: '#1A1F3C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text
        className="text-sm font-semibold text-ink dark:text-white"
        numberOfLines={1}
      >
        {cat.name}
      </Text>
      {!cat.is_active && (
        <View className="mt-1.5">
          <Badge label="Inactive" variant="warning" />
        </View>
      )}
    </TouchableOpacity>
  );
}
