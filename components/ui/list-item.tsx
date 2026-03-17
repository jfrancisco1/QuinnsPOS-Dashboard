import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
};

export function ListItem({ title, subtitle, right, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-950"
      activeOpacity={0.7}
    >
      <View className="mr-3 flex-1">
        <Text className="text-sm font-medium text-zinc-900 dark:text-white">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}
