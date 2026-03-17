import { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { createCategory } from '@/lib/api';

export default function NewCategoryScreen() {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await createCategory(token!, { name: name.trim(), is_active: isActive });
    setIsSubmitting(false);
    if (result.ok) {
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
          placeholder="e.g. Dry Cleaning"
          value={name}
          onChangeText={setName}
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
