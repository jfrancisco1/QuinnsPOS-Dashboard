import { Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { Card } from '@/components/ui/card';
import { type CategoryBreakdownRow } from '@/features/expenses/hooks/use-expenses';
import { fmtPeso } from '@/features/sales/utils';

const PALETTE = ['#9130F0', '#22C55E', '#F59E0B', '#0EA5E9', '#EF4444', '#14B8A6', '#EC4899', '#6366F1'];

type Props = {
  breakdown: CategoryBreakdownRow[];
};

export function ExpenseCategoryChart({ breakdown }: Props) {
  const total = breakdown.reduce((sum, r) => sum + r.amount, 0);

  if (breakdown.length === 0) {
    return (
      <Card title="By Category">
        <Text className="py-8 text-center text-sm text-muted">No expenses in this range</Text>
      </Card>
    );
  }

  const pieData = breakdown.map((row, i) => ({
    value: row.amount,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <Card title="By Category">
      <View className="items-center py-2">
        <PieChart data={pieData} radius={72} innerRadius={44} innerCircleColor="transparent" />
      </View>
      <View className="mt-3">
        {breakdown.map((row, i) => {
          const pct = total > 0 ? Math.round((row.amount / total) * 100) : 0;
          return (
            <View key={row.name}>
              <View className="flex-row items-center justify-between py-2.5">
                <View className="flex-1 flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                  <Text className="text-sm text-subtle dark:text-muted" numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text className="text-xs text-muted">{pct}%</Text>
                </View>
                <Text className="text-sm font-bold text-ink dark:text-white">{fmtPeso(row.amount)}</Text>
              </View>
              {i < breakdown.length - 1 && <View className="h-px bg-divide dark:bg-divide-dark" />}
            </View>
          );
        })}
      </View>
    </Card>
  );
}
