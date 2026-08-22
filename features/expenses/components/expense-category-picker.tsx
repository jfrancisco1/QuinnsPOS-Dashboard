import { Text, TouchableOpacity, View } from 'react-native';

import { type ExpenseCategory } from '@/lib/api';

type Props = {
  categories: ExpenseCategory[];
  selectedCategoryId: number | null;
  onSelect: (id: number) => void;
};

export function ExpenseCategoryPicker({ categories, selectedCategoryId, onSelect }: Props) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Category *</Text>
      <View className="flex-row flex-wrap gap-2">
        {categories
          .filter((c) => c.is_active)
          .map((cat) => {
            const active = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => onSelect(cat.id)}
                activeOpacity={0.75}
                className={`rounded-full px-3.5 py-2 ${active ? 'bg-primary' : 'bg-chip dark:bg-chip-dark'}`}
              >
                <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink dark:text-subtle-dark'}`}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}
