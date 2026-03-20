import { useCallback, useState } from 'react';
import { FlatList, SectionList, Text, TouchableOpacity, View } from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { CategoryCard } from '@/components/items/category-card';
import { ItemCard } from '@/components/items/item-card';
import { BranchPickerModal } from '@/components/ui/branch-picker-modal';
import { FAB } from '@/components/ui/fab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { getCategories, getItems, type Category, type Item } from '@/lib/api';

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function CatalogScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getItems(token), getCategories(token), loadBranches(token)]).then(
        ([itemsRes, catsRes]) => {
          if (itemsRes.ok) setItems(itemsRes.data);
          if (catsRes.ok) setCategories(catsRes.data);
          setLoading(false);
        },
      );
    }, [token, loadBranches]),
  );

  const sections = (() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.category?.name ?? 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([title, data]) => ({
      title,
      data: chunkArray(data, 2),
    }));
  })();

  const TABS = ['Items', 'Categories'];

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <View className="bg-primary px-5 pb-5 pt-14 dark:bg-primary-700">
        {/* Title row */}
        <View className="flex-row items-center">
          <View className="absolute left-0 right-0 items-center">
            <Text className="text-xl font-bold text-white">Catalog</Text>
            {selectedBranch ? (
              <Text className="text-xs font-semibold text-primary-100" numberOfLines={1}>
                {selectedBranch.name}
              </Text>
            ) : (
              <Text className="text-xs text-primary-200">All Branches</Text>
            )}
          </View>
          <View className="flex-1" />
          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20"
          >
            <IconSymbol name="storefront.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Items / Categories toggle */}
        <View className="mt-3 flex-row gap-2">
          {TABS.map((label, index) => {
            const active = tab === index;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setTab(index)}
                activeOpacity={0.75}
                className={`flex-1 items-center rounded-full py-1.5 ${active ? 'bg-white' : 'bg-white/20'}`}
              >
                <Text className={`text-sm font-semibold ${active ? 'text-primary' : 'text-white'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <BranchPickerModal visible={branchModalVisible} onClose={() => setBranchModalVisible(false)} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : tab === 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(row, index) => row.map((i) => String(i.id)).join('-') + index}
          contentContainerStyle={{ padding: 6 }}
          renderSectionHeader={({ section }) => (
            <View className="px-2 pb-1 pt-3">
              <Text className="text-xs font-semibold uppercase tracking-widest text-muted">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item: row }) => (
            <View className="flex-row">
              {row.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
              {row.length === 1 && <View className="m-1.5 flex-1" />}
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-muted">No items yet</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="categories"
          data={categories}
          keyExtractor={(cat, index) => String(cat.id ?? index)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item: cat }) => <CategoryCard cat={cat} />}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-muted">No categories yet</Text>
            </View>
          }
        />
      )}

      <FAB onPress={() => router.push(tab === 0 ? '/new-item' : '/new-category')} />
    </View>
  );
}
