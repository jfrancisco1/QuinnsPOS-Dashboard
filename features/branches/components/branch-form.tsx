import { ReactNode, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { TextInput } from '@/components/ui/text-input';
import type { ApiResult, Branch, BranchPayload } from '@/lib/api';

type Props = {
  initial?: { name: string; address: string; phone: string };
  submitLabel: string;
  onSubmit: (data: BranchPayload) => Promise<ApiResult<Branch>>;
  onSaved: (branch: Branch) => void;
  // Rendered under the submit button, e.g. the delete action on the edit screen.
  footer?: ReactNode;
};

export function BranchForm({ initial, submitLabel, onSubmit, onSaved, footer }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await onSubmit({ name: name.trim(), address: address.trim(), phone: phone.trim() });
    setIsSubmitting(false);
    if (result.ok) {
      onSaved(result.data);
    } else {
      // 403 (plan limit) and 422 messages are shown as-is.
      setError(result.error.message);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-950" keyboardShouldPersistTaps="handled">
      <View className="gap-4 p-4">
        <TextInput
          label="Name *"
          placeholder="e.g. Bubbly Wash Main"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          label="Address"
          placeholder="Street, barangay, city"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
          maxLength={500}
        />
        <TextInput
          label="Phone"
          placeholder="e.g. 0917 000 0000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={20}
        />

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
          className={`w-full items-center rounded-lg bg-primary py-3.5${isSubmitting ? ' opacity-50' : ''}`}
        >
          <Text className="text-sm font-semibold text-white">
            {isSubmitting ? 'Saving...' : submitLabel}
          </Text>
        </TouchableOpacity>

        {footer}
      </View>
    </ScrollView>
  );
}
