import { Text, View } from 'react-native';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  label: string;
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: {
    container: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-600 dark:text-zinc-300',
  },
  success: {
    container: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-400',
  },
  warning: {
    container: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  danger: {
    container: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-400',
  },
  info: {
    container: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-400',
  },
};

export function Badge({ label, variant = 'default' }: Props) {
  const s = variantStyles[variant];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${s.container}`}>
      <Text className={`text-xs font-medium ${s.text}`}>{label}</Text>
    </View>
  );
}
