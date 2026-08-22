import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { deleteExpenseCategory, updateExpenseCategory } from '@/lib/api';

export default function EditExpenseCategoryScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    is_active: string;
    sort_order: string;
  }>();
  const categoryId = Number(params.id);

  const [name, setName] = useState(params.name ?? '');
  const [isActive, setIsActive] = useState(params.is_active !== '0');
  const [sortOrder, setSortOrder] = useState(params.sort_order ?? '0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return; }

    setIsSubmitting(true);
    setError(null);
    const result = await updateExpenseCategory(token!, categoryId, {
      name: name.trim(),
      is_active: isActive,
      sort_order: Number(sortOrder),
    });
    setIsSubmitting(false);
    if (result.ok) {
      router.back();
    } else {
      setError(result.error.message);
    }
  }

  function handleDelete() {
    Alert.alert('Delete Category', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          const result = await deleteExpenseCategory(token!, categoryId);
          setIsDeleting(false);
          if (result.ok) {
            router.back();
          } else {
            setError(result.error.message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="gap-4 p-4">
        <TextInput
          label="Name *"
          placeholder="e.g. Rent"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          label="Sort Order"
          placeholder="0"
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="numeric"
        />

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
            {isDeleting ? 'Deleting...' : 'Delete Category'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
