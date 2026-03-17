import { Badge } from "@/components/ui/badge";
import { FAB } from "@/components/ui/fab";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAuth } from "@/context/auth-context";
import { getCategories, getItems, type Category, type Item } from "@/lib/api";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function ItemShapeSwatch({ color, shape }: { color: string; shape: string }) {
  if (shape === "circle") {
    return (
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: color,
        }}
      />
    );
  }
  if (shape === "square") {
    return (
      <View
        style={{
          width: 15,
          height: 15,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />
    );
  }
  if (shape === "star") {
    return <Text style={{ fontSize: 21, color, lineHeight: 21 }}>★</Text>;
  }
  if (shape === "diamond") {
    return (
      <View
        style={{
          width: 18,
          height: 18,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 13,
            height: 13,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          }}
        />
      </View>
    );
  }
  return null;
}

function ItemCard({ item }: { item: Item }) {
  function openEdit() {
    router.push({
      pathname: "/edit-item",
      params: {
        id: String(item.id),
        name: item.name,
        price: String(item.price),
        cost: String(item.cost),
        description: item.description ?? "",
        is_active: item.is_active ? "1" : "0",
        category_id: String(item.category?.id ?? ""),
        color: item.color ?? "",
        shape: item.shape ?? "",
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={openEdit}
      activeOpacity={0.75}
      style={{
        flex: 1,
        margin: 6,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e4e4e7",
      }}
    >
      <View style={{ padding: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Text
            className="flex-1 text-sm font-semibold text-zinc-900 dark:text-white"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.color && item.shape ? (
            <View style={{ marginLeft: 6, marginTop: 1 }}>
              <ItemShapeSwatch color={item.color} shape={item.shape} />
            </View>
          ) : null}
        </View>
        <Text
          className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
          numberOfLines={1}
        >
          {item.category?.name ?? "—"}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-zinc-900 dark:text-white">
            ₱{Number(item.price).toFixed(2)}
          </Text>
          {!item.is_active && <Badge label="Inactive" variant="warning" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CategoryCard({ cat }: { cat: Category }) {
  function openEdit() {
    router.push({
      pathname: "/edit-category",
      params: {
        id: String(cat.id),
        name: cat.name,
        is_active: cat.is_active ? "1" : "0",
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={openEdit}
      activeOpacity={0.75}
      style={{
        flex: 1,
        margin: 6,
        borderRadius: 16,
        padding: 16,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e4e4e7",
      }}
    >
      <Text
        className="text-sm font-semibold text-zinc-900 dark:text-white"
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

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function CatalogScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getItems(token), getCategories(token)]).then(
        ([itemsRes, catsRes]) => {
          if (itemsRes.ok) setItems(itemsRes.data);
          if (catsRes.ok) setCategories(catsRes.data);
          setLoading(false);
        },
      );
    }, [token]),
  );

  // Group items by category for SectionList
  const sections = (() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.category?.name ?? "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([title, data]) => ({
      title,
      data: chunkArray(data, 2),
    }));
  })();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <View className="px-4 pb-2 pt-14">
        <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
          Items
        </Text>
      </View>

      <SegmentedControl
        options={["Items", "Categories"]}
        selectedIndex={tab}
        onChange={setTab}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading...
          </Text>
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
              <Text className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item: row }) => (
            <View style={{ flexDirection: "row" }}>
              {row.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
              {row.length === 1 && <View style={{ flex: 1, margin: 6 }} />}
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                No items yet
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="categories"
          data={categories}
          numColumns={2}
          keyExtractor={(cat, index) => String(cat.id ?? index)}
          contentContainerStyle={{ padding: 6 }}
          renderItem={({ item: cat }) => <CategoryCard cat={cat} />}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                No categories yet
              </Text>
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
