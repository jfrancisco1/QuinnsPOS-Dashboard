import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { type SalesSummary } from '@/lib/api';
import { fmtPeso } from '@/features/sales/utils';

type Props = {
  summary: SalesSummary | null;
  grossProfit: number;
  totalExpenses: number;
};

export function BreakdownCard({ summary, grossProfit, totalExpenses }: Props) {
  const netProfit = summary?.netProfit ?? 0;
  const mainItems = [
    { label: 'Gross Sales', value: summary?.grossSales ?? 0, color: '#560591', bold: false },
    { label: 'Net Sales', value: summary?.grossSales ?? 0, color: '#9130F0', bold: false },
    { label: 'Cost of Goods', value: summary?.costOfGoods ?? 0, color: '#F59E0B', bold: false },
    { label: 'Gross Profit', value: grossProfit, color: '#22C55E', bold: true },
    { label: 'Expenses', value: -totalExpenses, color: '#EF4444', bold: false },
    { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? '#22C55E' : '#EF4444', bold: true },
  ];
  return (
    <Card title="Breakdown">
      {mainItems.map((item, i) => (
        <View key={item.label}>
          <View
            className={`flex-row items-center justify-between py-2.5 ${
              item.bold ? 'bg-chip dark:bg-chip-dark -mx-4 px-4 rounded-xl' : ''
            }`}
          >
            <Text
              className={`text-sm ${
                item.bold ? 'font-bold text-ink dark:text-white' : 'text-subtle dark:text-muted'
              }`}
            >
              {item.label}
            </Text>
            <Text className="text-sm font-bold" style={{ color: item.color }}>
              {item.value < 0 ? `-${fmtPeso(Math.abs(item.value))}` : fmtPeso(Math.abs(item.value))}
            </Text>
          </View>
          {i < mainItems.length - 1 && <View className="h-px bg-divide dark:bg-divide-dark" />}
        </View>
      ))}
    </Card>
  );
}
