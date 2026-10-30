import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Card } from '@/components/ui/card';
import { type SalesSummary } from '@/lib/api';
import { fmtPeso } from '@/features/sales/utils';

type Props = {
  summary: SalesSummary | null;
  grossProfit: number;
  totalExpenses: number;
  // What previousNetSales covers, e.g. "this point last week"; null hides the comparison.
  compareLabel: string | null;
};

// "▲ 8% vs this point last week". Hidden when there's nothing to compare against
// (with no previous sales a percentage means nothing).
function netSalesChange(summary: SalesSummary | null, compareLabel: string | null) {
  const previous = summary?.previousNetSales;
  if (summary == null || previous == null || previous <= 0 || compareLabel == null) return null;
  const pct = Math.round(((summary.netSales - previous) / previous) * 100);
  if (pct === 0) return { text: `No change vs ${compareLabel}`, color: '#71717A', darkColor: '#A1A1AA' };
  return pct > 0
    ? { text: `▲ ${pct}% vs ${compareLabel}`, color: '#16A34A', darkColor: '#86EFAC' }
    : { text: `▼ ${Math.abs(pct)}% vs ${compareLabel}`, color: '#DC2626', darkColor: '#FCA5A5' };
}

export function BreakdownCard({ summary, grossProfit, totalExpenses, compareLabel }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const netProfit = summary?.netProfit ?? 0;
  const collected = summary?.collected ?? 0;
  const change = netSalesChange(summary, compareLabel);
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
            <View>
              <Text
                className={`text-sm ${
                  item.bold ? 'font-bold text-ink dark:text-white' : 'text-subtle dark:text-muted'
                }`}
              >
                {item.label}
              </Text>
              {item.label === 'Net Sales' && change && (
                <Text className="mt-0.5 text-xs font-semibold" style={{ color: isDark ? change.darkColor : change.color }}>
                  {change.text}
                </Text>
              )}
            </View>
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
