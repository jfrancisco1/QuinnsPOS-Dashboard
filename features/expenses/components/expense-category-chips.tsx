import { ScrollView, Text, TouchableOpacity } from 'react-native';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { type ExpenseCategory } from '@/lib/api';

type Props = {
  categories: ExpenseCategory[];
  selectedCategoryId: number | 'all';
  onSelect: (id: number | 'all') => void;
};

export function ExpenseCategoryChips({ categories, selectedCategoryId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-3"
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}
    >
      <TouchableOpacity
        onPress={() => onSelect('all')}
        activeOpacity={0.75}
        className={`items-center rounded-full px-3.5 py-1.5 ${selectedCategoryId === 'all' ? 'bg-white' : 'bg-white/20'}`}
      >
        <Text className={`text-sm font-semibold ${selectedCategoryId === 'all' ? 'text-primary' : 'text-white'}`}>
          All
        </Text>
      </TouchableOpacity>
      {categories
        .filter((c) => c.is_active)
        .map((cat) => {
          const active = selectedCategoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.75}
              className={`items-center rounded-full px-3.5 py-1.5 ${active ? 'bg-white' : 'bg-white/20'}`}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-primary' : 'text-white'}`} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      <TouchableOpacity
        onPress={() => router.push('/expense-categories')}
        activeOpacity={0.75}
        className="flex-row items-center gap-1 rounded-full bg-white/20 px-3.5 py-1.5"
      >
        <IconSymbol name="gearshape.fill" size={13} color="#fff" />
        <Text className="text-sm font-semibold text-white">Manage</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
