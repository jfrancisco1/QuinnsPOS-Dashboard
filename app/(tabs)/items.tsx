import { useState } from "react";
import {
  FlatList,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { BranchPickerModal } from "@/components/ui/branch-picker-modal";
import { FAB } from "@/components/ui/fab";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuth } from "@/context/auth-context";
import { useBranch } from "@/context/branch-context";
import { CategoryCard } from "@/features/catalog/components/category-card";
import { ItemCard } from "@/features/catalog/components/item-card";
import { useCatalog } from "@/features/catalog/hooks/use-catalog";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const TABS = ["Items", "Categories"];

export default function CatalogScreen() {
  const { token } = useAuth();
  const { selectedBranch, loadBranches } = useBranch();
  const [tab, setTab] = useState(0);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const { items, categories, loading } = useCatalog({ token, selectedBranch, loadBranches });

  const sections = (() => {
    const map = new Map<number | null, { title: string; sortOrder: number; items: typeof items }>();
    for (const item of items) {
      const key = item.category?.id ?? null;
      if (!map.has(key)) {
        map.set(key, {
          title: item.category?.name ?? "Uncategorized",
          sortOrder: item.category?.sort_order ?? Infinity,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ title, items: data }) => ({
        title,
        data: chunkArray([...data].sort((a, b) => a.sort_order - b.sort_order), 2),
      }));
  })();

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader
        title="Items"
        subtitle={selectedBranch?.name}
        onBranchPress={() => setBranchModalVisible(true)}
      >
        <View className="mt-3 flex-row gap-2">
          {TABS.map((label, index) => {
            const active = tab === index;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setTab(index)}
                activeOpacity={0.75}
                className={`flex-1 items-center rounded-full py-1.5 ${active ? "bg-white" : "bg-white/20"}`}
              >
                <Text
                  className={`text-sm font-semibold ${active ? "text-primary" : "text-white"}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScreenHeader>

      <BranchPickerModal
        visible={branchModalVisible}
        onClose={() => setBranchModalVisible(false)}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : tab === 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(row, index) =>
            row.map((i) => String(i.id)).join("-") + index
          }
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
          data={[...categories].sort((a, b) => a.sort_order - b.sort_order)}
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

      <FAB
        onPress={() => router.push(tab === 0 ? "/new-item" : "/new-category")}
      />
    </View>
  );
}
