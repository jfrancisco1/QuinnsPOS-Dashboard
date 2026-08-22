import { Pressable, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export function ExpenseSearchBar({ value, onChangeText }: Props) {
  return (
    <View className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
      <View className="flex-row items-center rounded-lg bg-zinc-100 px-3 dark:bg-zinc-800">
        <IconSymbol name="magnifyingglass" size={16} color="#71717a" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search by description or amount..."
          placeholderTextColor="#71717a"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="flex-1 py-2.5 pl-2 text-sm text-zinc-900 dark:text-white"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={16} color="#71717a" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
