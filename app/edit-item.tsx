import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { CategorySelector } from '@/features/catalog/components/category-selector';
import { ColorPicker } from '@/features/catalog/components/color-picker';
import { ShapePicker } from '@/features/catalog/components/shape-picker';
import { deleteItem, getCategories, updateItem, type Category } from '@/lib/api';
import { type ItemShape } from '@/lib/item-options';

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
    sort_order: string;
  }>();
  const itemId = Number(params.id);
  const { showToast } = useToast();

  const [name, setName] = useState(params.name ?? '');
  const [price, setPrice] = useState(params.price ?? '');
  const [cost, setCost] = useState(params.cost ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [isActive, setIsActive] = useState(params.is_active !== '0');
  const [categoryId, setCategoryId] = useState<number | null>(
    params.category_id ? Number(params.category_id) : null,
  );
  const [color, setColor] = useState<string | null>(params.color || null);
  const [shape, setShape] = useState<ItemShape | null>((params.shape as ItemShape) || null);
  const [sortOrder, setSortOrder] = useState(params.sort_order ?? '0');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getCategories(token).then((result) => {
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
      sort_order: Number(sortOrder),
    });
    setIsSubmitting(false);
    if (result.ok) {
      showToast('Changes saved');
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
          const result = await deleteItem(token!, itemId);
          setIsDeleting(false);
          if (result.ok) {
            showToast('Item deleted');
            router.back();
          } else {
            setError(result.error.message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
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
        <TextInput
          label="Sort Order"
          placeholder="0"
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="numeric"
        />

        <View>
          <Text className="mb-2 text-sm font-medium text-subtle dark:text-subtle-dark">Color</Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        <View>
          <Text className="mb-2 text-sm font-medium text-subtle dark:text-subtle-dark">Shape</Text>
          <ShapePicker value={shape} color={color} onChange={setShape} />
        </View>

        <View>
          <Text className="mb-2 text-sm font-medium text-subtle dark:text-subtle-dark">
            Category *
          </Text>
          <CategorySelector categories={categories} value={categoryId} onChange={setCategoryId} />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-subtle dark:text-subtle-dark">Active</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          className={`w-full items-center rounded-xl bg-primary py-3.5${isSubmitting ? ' opacity-50' : ''}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-white">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className={`w-full items-center rounded-xl border border-red-300 py-3.5 dark:border-red-800${isDeleting ? ' opacity-50' : ''}`}
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
