import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { CategorySelector } from '@/features/catalog/components/category-selector';
import { ColorPicker } from '@/features/catalog/components/color-picker';
import { ShapePicker } from '@/features/catalog/components/shape-picker';
import { createItem, getCategories, type Category } from '@/lib/api';
import { type ItemShape } from '@/lib/item-options';

export default function NewItemScreen() {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [color, setColor] = useState<string | null>(null);
  const [shape, setShape] = useState<ItemShape | null>(null);
  const [sortOrder, setSortOrder] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getCategories(token).then((result) => {
      if (result.ok) setCategories(result.data);
    });
  }, [token]);

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!price) { setError('Price is required.'); return; }
    if (!cost) { setError('Cost is required.'); return; }
    if (categoryId === null) { setError('Please select a category.'); return; }

    setIsSubmitting(true);
    setError(null);
    const result = await createItem(token!, {
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
      router.back();
    } else {
      setError(result.error.message);
    }
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
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`w-full items-center rounded-xl bg-primary py-3.5${isSubmitting ? ' opacity-50' : ''}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-white">
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
