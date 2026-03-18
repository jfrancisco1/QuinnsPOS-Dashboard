import { Text, View } from 'react-native';

export type StatCardColor = 'sky' | 'emerald' | 'amber' | 'violet' | 'default';

const colorMap: Record<StatCardColor, { bg: string; label: string; value: string }> = {
  sky: {
    bg: 'bg-sky-500',
    label: 'text-sky-100',
    value: 'text-white',
  },
  emerald: {
    bg: 'bg-emerald-500',
    label: 'text-emerald-100',
    value: 'text-white',
  },
  amber: {
    bg: 'bg-amber-400',
    label: 'text-amber-900',
    value: 'text-amber-950',
  },
  violet: {
    bg: 'bg-violet-500',
    label: 'text-violet-100',
    value: 'text-white',
  },
  default: {
    bg: 'bg-white dark:bg-zinc-900',
    label: 'text-zinc-500 dark:text-zinc-400',
    value: 'text-zinc-900 dark:text-white',
  },
};

type Props = {
  label: string;
  value: string;
  color?: StatCardColor;
};

export function StatCard({ label, value, color = 'default' }: Props) {
  const styles = colorMap[color];
  return (
    <View className={`flex-1 rounded-2xl p-4 ${styles.bg}`}>
      <Text className={`mb-1 text-xs font-semibold uppercase tracking-wide ${styles.label}`}>
        {label}
      </Text>
      <Text className={`text-xl font-bold ${styles.value}`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
