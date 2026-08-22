import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { FAB } from '@/components/ui/fab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth-context';
import { ExpenseCategoryCard } from '@/features/expenses/components/expense-category-card';
import { useExpenseCategories } from '@/features/expenses/hooks/use-expense-categories';

export default function ExpenseCategoriesScreen() {
  const { token } = useAuth();
  const { categories, loading } = useExpenseCategories({ token });

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <View className="bg-primary px-5 pb-5 pt-14 dark:bg-primary-700">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.75}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
          >
            <Text className="text-xl font-bold text-white">‹</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">Expense Categories</Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(cat, index) => String(cat.id ?? index)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 100 }}
          renderItem={({ item }) => <ExpenseCategoryCard cat={item} />}
          ListEmptyComponent={
            <View className="items-center py-20">
              <IconSymbol name="tag.fill" size={28} color="#8A8FA8" />
              <Text className="mt-2 text-sm text-muted">No categories yet</Text>
            </View>
          }
        />
      )}

      <FAB onPress={() => router.push('/new-expense-category')} />
    </View>
  );
}
