import { View } from 'react-native';

import { StatCard } from '@/components/ui/stat-card';
import { fmtPeso } from '@/features/sales/utils';

type Props = {
  total: number;
  count: number;
};

export function ExpenseSummaryRow({ total, count }: Props) {
  return (
    <View className="flex-row gap-3">
      <StatCard label="Total Expenses" value={fmtPeso(total)} color="indigo" />
      <StatCard label="Transactions" value={String(count)} color="default" />
    </View>
  );
}
