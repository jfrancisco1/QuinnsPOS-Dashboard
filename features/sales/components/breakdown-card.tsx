import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Card } from '@/components/ui/card';
import { type SalesSummary } from '@/lib/api';
import { fmtPeso } from '@/features/sales/utils';

type Props = {
  summary: SalesSummary | null;
  grossProfit: number;
  totalExpenses: number;
};

export function BreakdownCard({ summary, grossProfit, totalExpenses }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const netProfit = summary?.netProfit ?? 0;
  const collected = summary?.collected ?? 0;
  const mainItems = [
    { label: 'Gross Sales', value: summary?.grossSales ?? 0, color: '#560591', darkColor: '#C084FC', bold: false, currency: true },
    { label: 'Discounts', value: -(summary?.discounts ?? 0), color: '#EF4444', darkColor: '#FCA5A5', bold: false, currency: true },
    { label: 'Net Sales', value: summary?.netSales ?? 0, color: '#9130F0', darkColor: '#D8B4FE', bold: false, currency: true },
    { label: 'Cost of Goods', value: summary?.costOfGoods ?? 0, color: '#F59E0B', darkColor: '#FCD34D', bold: false, currency: true },
    { label: 'Gross Profit', value: grossProfit, color: '#22C55E', darkColor: '#86EFAC', bold: true, currency: true },
    { label: 'Expenses', value: -totalExpenses, color: '#EF4444', darkColor: '#FCA5A5', bold: false, currency: true },
    { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? '#22C55E' : '#EF4444', darkColor: netProfit >= 0 ? '#86EFAC' : '#FCA5A5', bold: true, currency: true },
    { label: 'Collected', value: collected, color: '#22C55E', darkColor: '#86EFAC', bold: false, currency: true },
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
            <Text className="text-sm font-bold" style={{ color: isDark ? item.darkColor : item.color }}>
              {item.currency
                ? item.value < 0 ? `-${fmtPeso(Math.abs(item.value))}` : fmtPeso(Math.abs(item.value))
                : String(item.value)}
            </Text>
          </View>
          {i < mainItems.length - 1 && <View className="h-px bg-divide dark:bg-divide-dark" />}
        </View>
      ))}
    </Card>
  );
}
