import { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { createExpenseCategory } from '@/lib/api';

export default function NewExpenseCategoryScreen() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await createExpenseCategory(token!, {
      name: name.trim(),
      is_active: isActive,
      sort_order: Number(sortOrder),
    });
    setIsSubmitting(false);
    if (result.ok) {
      showToast('Category created');
      router.back();
    } else {
      setError(result.error.message);
    }
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

        {error ? (
          <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`w-full items-center rounded-lg bg-zinc-900 py-3.5 dark:bg-white${isSubmitting ? ' opacity-50' : ''}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-white dark:text-zinc-900">
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
