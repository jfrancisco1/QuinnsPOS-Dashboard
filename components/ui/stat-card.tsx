import { Text, View } from 'react-native';

export type StatCardColor = 'sky' | 'emerald' | 'amber' | 'violet' | 'indigo' | 'default';

const colorMap: Record<StatCardColor, { bg: string; label: string; value: string; shadow?: string }> = {
  indigo: {
    bg: 'bg-[#3B55D5]',
    label: 'text-[#BFCEFF]',
    value: 'text-white',
  },
  sky: {
    bg: 'bg-white dark:bg-[#1C1E38]',
    label: 'text-[#8A8FA8]',
    value: 'text-[#1A1F3C] dark:text-white',
  },
  emerald: {
    bg: 'bg-white dark:bg-[#1C1E38]',
    label: 'text-[#8A8FA8]',
    value: 'text-[#22C55E] dark:text-[#22C55E]',
  },
  amber: {
    bg: 'bg-white dark:bg-[#1C1E38]',
    label: 'text-[#8A8FA8]',
    value: 'text-[#F59E0B] dark:text-[#F59E0B]',
  },
  violet: {
    bg: 'bg-white dark:bg-[#1C1E38]',
    label: 'text-[#8A8FA8]',
    value: 'text-[#8B5CF6] dark:text-[#8B5CF6]',
  },
  default: {
    bg: 'bg-white dark:bg-[#1C1E38]',
    label: 'text-[#8A8FA8]',
    value: 'text-[#1A1F3C] dark:text-white',
  },
};

type Props = {
  label: string;
  value: string;
  color?: StatCardColor;
};

export function StatCard({ label, value, color = 'default' }: Props) {
  const styles = colorMap[color];
  const isBlue = color === 'indigo';

  return (
    <View
      className={`flex-1 rounded-2xl p-4 ${styles.bg}`}
      style={{
        shadowColor: isBlue ? '#3B55D5' : '#1A1F3C',
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
