import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { Card } from '@/components/ui/card';
import { type SalesSummary } from '@/lib/api';
import { type Period } from '@/lib/date-helpers';

const Y_AXIS_WIDTH = 38;
const chartAxisStyle = { color: '#8A8FA8', fontSize: 10 };
const chartXLabelStyle = { color: '#5A5E7A', fontSize: 9, textAlign: 'center' as const };

function formatYLabel(v: string) {
  const n = Number(v);
  if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₱${(n / 1000).toFixed(0)}k`;
  return `₱${n}`;
}

type Props = {
  period: Period;
  offset: number;
  isTimeSeries: boolean;
  dailySummaries: { date: string; netSales: number }[];
  summary: SalesSummary | null;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  customGranularity: 'day' | 'month' | 'year';
  containerWidth: number;
  onLayout: (width: number) => void;
};

export function SalesOverviewChart({
  period,
  offset,
  isTimeSeries,
  dailySummaries,
  summary,
  grossProfit,
  totalExpenses,
  netProfit,
  customGranularity,
  containerWidth,
  onLayout,
}: Props) {
  const barArea = Math.max(containerWidth - Y_AXIS_WIDTH, 0);

  const weeklySpacing = 6;
  const weeklyBarWidth = Math.max(1, Math.floor((barArea - weeklySpacing * 6) / 7));
  const yearlySpacing = 4;
  const yearlyBarWidth = Math.max(1, Math.floor((barArea - yearlySpacing * 11) / 12));
  const monthlySpacing = 2;
  const monthlyNumBars =
    period === 'this_month' && dailySummaries.length > 0 ? dailySummaries.length : 31;
  const monthlyBarWidth = Math.max(
    1,
    Math.floor((barArea - monthlySpacing * (monthlyNumBars - 1)) / monthlyNumBars),
  );
  const customNumBars = Math.max(dailySummaries.length, 1);
  const customSpacing = customGranularity === 'day' ? 2 : 6;
  const customBarWidth = Math.max(
    1,
    Math.floor((barArea - customSpacing * (customNumBars - 1)) / customNumBars),
  );

  const LABEL_WIDTH = 14;
  const monthlyInterval =
    monthlyBarWidth > 0
      ? Math.max(1, Math.ceil(LABEL_WIDTH / (monthlyBarWidth + monthlySpacing)))
      : 5;
  const customDayInterval =
    customBarWidth > 0
      ? Math.max(1, Math.ceil(LABEL_WIDTH / (customBarWidth + customSpacing)))
      : 5;

  const timeSeriesChartData = dailySummaries.map(({ date: label, netSales }, i) => ({
    value: netSales,
    frontColor: '#CCFFCC',
    label:
      period === 'this_month'
        ? i % monthlyInterval === 0
          ? label
          : ''
        : period === 'custom' && customGranularity === 'day'
          ? i % customDayInterval === 0
            ? label
            : ''
          : label,
  }));

  const chartData = [
    { value: summary?.grossSales ?? 0, label: 'Gross', frontColor: '#560591' },
    { value: summary?.netSales ?? 0, label: 'Net Sales', frontColor: '#9130F0' },
    { value: summary?.costOfGoods ?? 0, label: 'COGS', frontColor: '#F59E0B' },
    { value: grossProfit, label: 'Gross\nProfit', frontColor: '#22C55E' },
    { value: totalExpenses, label: 'Expenses', frontColor: '#EF4444' },
    {
      value: Math.max(netProfit, 0),
      label: 'Net\nProfit',
      frontColor: netProfit >= 0 ? '#0EA5E9' : '#EF4444',
    },
  ];

  const barWidth =
    period === 'this_year'
      ? yearlyBarWidth
      : period === 'this_month'
        ? monthlyBarWidth
        : period === 'custom'
          ? customBarWidth
          : weeklyBarWidth;

  const spacing =
    period === 'this_year'
      ? yearlySpacing
      : period === 'this_month'
        ? monthlySpacing
        : period === 'custom'
          ? customSpacing
          : weeklySpacing;

  return (
    <Card title="Sales Overview">
      <View onLayout={(e) => onLayout(e.nativeEvent.layout.width)}>
        {containerWidth === 0 ? null : isTimeSeries ? (
          <BarChart
            key={`ts-${containerWidth}-${period}-${offset}-${timeSeriesChartData.length}`}
            data={timeSeriesChartData}
            barWidth={barWidth}
            spacing={spacing}
            width={barArea}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            initialSpacing={0}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={chartAxisStyle}
            xAxisLabelTextStyle={chartXLabelStyle}
            noOfSections={4}
            maxValue={Math.max(...timeSeriesChartData.map((d) => d.value), 1) * 1.2}
            barBorderRadius={0}
            formatYLabel={formatYLabel}
          />
        ) : (
          <BarChart
            key={`summary-${containerWidth}-${period}-${offset}`}
            data={chartData}
            barWidth={38}
            spacing={12}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={chartAxisStyle}
            xAxisLabelTextStyle={chartXLabelStyle}
            noOfSections={4}
            maxValue={Math.max(...chartData.map((d) => d.value), 1) * 1.2}
            barBorderRadius={0}
            formatYLabel={formatYLabel}
          />
        )}
      </View>
    </Card>
  );
}
