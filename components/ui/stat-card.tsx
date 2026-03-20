import { Text, View } from 'react-native';

export type StatCardColor = 'sky' | 'emerald' | 'amber' | 'violet' | 'indigo' | 'default';

const colorMap: Record<StatCardColor, { bg: string; label: string; value: string }> = {
  indigo: {
    bg: 'bg-primary',
    label: 'text-primary-200',
    value: 'text-white',
  },
  sky: {
    bg: 'bg-white dark:bg-card-dark',
    label: 'text-muted',
    value: 'text-ink dark:text-white',
  },
  emerald: {
    bg: 'bg-white dark:bg-card-dark',
    label: 'text-muted',
    value: 'text-green-500 dark:text-green-500',
  },
  amber: {
    bg: 'bg-white dark:bg-card-dark',
    label: 'text-muted',
    value: 'text-amber-400 dark:text-amber-400',
  },
  violet: {
    bg: 'bg-white dark:bg-card-dark',
    label: 'text-muted',
    value: 'text-violet-500 dark:text-violet-500',
  },
  default: {
    bg: 'bg-white dark:bg-card-dark',
    label: 'text-muted',
    value: 'text-ink dark:text-white',
  },
};

export type StatCardProps = {
  label: string;
  value: string;
  color?: StatCardColor;
};

export function StatCard({ label, value, color = 'default' }: StatCardProps) {
  const styles = colorMap[color];
  const isBlue = color === 'indigo';

  return (
    <View
      className={`flex-1 rounded-2xl p-4 ${styles.bg}`}
      style={{
        shadowColor: isBlue ? '#560591' : '#1A1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isBlue ? 0.35 : 0.07,
        shadowRadius: 12,
        elevation: isBlue ? 6 : 2,
      }}
    >
      <Text className={`mb-1 text-xs font-semibold uppercase tracking-wide ${styles.label}`}>
        {label}
      </Text>
      <Text className={`text-xl font-bold ${styles.value}`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
