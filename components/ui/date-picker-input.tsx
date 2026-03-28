import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
};

export function DatePickerInput({ label, value, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const formatted = value.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  function handleChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) onChange(selected);
  }

  return (
    <View>
      <Text className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
      <TouchableOpacity
        onPress={() => setShowPicker((v) => !v)}
        activeOpacity={0.7}
        className="flex-row items-center rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <Text className="flex-1 text-zinc-900 dark:text-white">{formatted}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}
