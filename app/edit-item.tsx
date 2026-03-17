import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import {
  deleteItem,
  getCategories,
  updateItem,
  type Category,
} from '@/lib/api';
import { ITEM_COLORS, ITEM_SHAPES, type ItemShape } from '@/lib/item-options';

export default function EditItemScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    price: string;
    cost: string;
    description: string;
    is_active: string;
    category_id: string;
    color: string;
    shape: string;
  }>();
  const itemId = Number(params.id);

  const [name, setName] = useState(params.name ?? '');
  const [price, setPrice] = useState(params.price ?? '');
  const [cost, setCost] = useState(params.cost ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [isActive, setIsActive] = useState(params.is_active !== '0');
  const [categoryId, setCategoryId] = useState<number | null>(
    params.category_id ? Number(params.category_id) : null,
  );
  const [color, setColor] = useState<string | null>(params.color || null);
  const [shape, setShape] = useState<ItemShape | null>(
    (params.shape as ItemShape) || null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getCategories(token).then(result => {
      if (result.ok) setCategories(result.data);
    });
  }, [token]);

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!price) { setError('Price is required.'); return; }
    if (!cost) { setError('Cost is required.'); return; }
    if (categoryId === null) { setError('Please select a category.'); return; }

    setIsSubmitting(true);
    setError(null);
    const result = await updateItem(token!, itemId, {
      name: name.trim(),
      price: parseFloat(price),
      cost: parseFloat(cost),
      description: description.trim() || undefined,
      color: color ?? undefined,
      shape: shape ?? undefined,
      is_active: isActive,
      category_id: categoryId,
    });
    setIsSubmitting(false);
    if (result.ok) {
      router.back();
    } else {
      setError(result.error.message);
    }
  }

  function handleDelete() {
    Alert.alert('Delete Item', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          await deleteItem(token!, itemId);
          setIsDeleting(false);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="gap-4 p-4">
        <TextInput label="Name *" placeholder="e.g. Wash & Fold" value={name} onChangeText={setName} />
        <TextInput
          label="Price *"
          placeholder="0.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          label="Cost *"
          placeholder="0.00"
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
        />
        <TextInput
          label="Description"
          placeholder="Optional description"
          value={description}
          onChangeText={setDescription}
        />

        {/* Color picker */}
        <View>
          <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ITEM_COLORS.map(hex => {
              const selected = color === hex;
              return (
                <TouchableOpacity
                  key={hex}
                  onPress={() => setColor(selected ? null : hex)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: hex,
                    borderWidth: selected ? 3 : 1.5,
                    borderColor: selected ? '#18181b' : hex,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: hex === '#18181b' ? '#fff' : '#18181b',
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Shape picker */}
        <View>
          <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Shape</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ITEM_SHAPES.map(s => {
              const selected = shape === s;
              const fillColor = color ?? '#18181b';
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setShape(selected ? null : s)}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? '#f4f4f5' : 'transparent',
                    borderWidth: 1.5,
                    borderColor: selected ? '#18181b' : '#d4d4d8',
                  }}
                >
                  {s === 'circle' && (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: fillColor }} />
                  )}
                  {s === 'square' && (
                    <View style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: fillColor }} />
                  )}
                  {s === 'star' && (
                    <Text style={{ fontSize: 26, color: fillColor, lineHeight: 28 }}>★</Text>
                  )}
                  {s === 'diamond' && (
                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 20, height: 20, borderRadius: 2, backgroundColor: fillColor, transform: [{ rotate: '45deg' }] }} />
                    </View>
                  )}
                  <Text style={{ fontSize: 9, marginTop: 4, color: '#71717a', textTransform: 'capitalize' }}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category */}
        <View>
          <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Category *
          </Text>
          {categories.length === 0 ? (
            <Text className="text-sm text-zinc-400 dark:text-zinc-500">No categories found.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {categories.map(cat => {
                  const selected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: selected ? '#18181b' : 'transparent',
                        borderWidth: 1.5,
                        borderColor: '#18181b',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '500', color: selected ? '#fff' : '#18181b' }}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          className={`w-full items-center rounded-lg bg-zinc-900 py-3.5 dark:bg-white${isSubmitting ? ' opacity-50' : ''}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-white dark:text-zinc-900">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className={`w-full items-center rounded-lg border border-red-300 py-3.5 dark:border-red-800${isDeleting ? ' opacity-50' : ''}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
            {isDeleting ? 'Deleting...' : 'Delete Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
