import { Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: Props) {
  return (
    <View className="flex-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </Text>
      <Text className="text-xl font-bold text-zinc-900 dark:text-white" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
