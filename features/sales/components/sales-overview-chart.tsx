import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { Card } from '@/components/ui/card';
import { type SalesSummary } from '@/lib/api';

const Y_AXIS_WIDTH = 38;
const chartAxisStyle = { color: '#8A8FA8', fontSize: 10 };
const chartXLabelStyle = { color: '#5A5E7A', fontSize: 9, textAlign: 'center' as const };

// Approximate pixel width of the widest label per granularity (fontSize 9)
const LABEL_WIDTH: Record<string, number> = {
  hour: 22, // "12am"
  day: 12,  // "30"
  month: 16, // "Sep"
  year: 22,  // "2024"
};

function formatYLabel(v: string) {
  const n = Number(v);
  if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₱${(n / 1000).toFixed(0)}k`;
  return `₱${n}`;
}

type Props = {
  granularity: SalesSummary['group_by'];
  dailySummaries: { date: string; netSales: number }[];
  containerWidth: number;
  onLayout: (width: number) => void;
};

export function SalesOverviewChart({ granularity, dailySummaries, containerWidth, onLayout }: Props) {
  const barArea = Math.max(containerWidth - Y_AXIS_WIDTH, 0);
  const numBars = Math.max(dailySummaries.length, 1);

  const spacing = granularity === 'hour' || granularity === 'day' ? 2 : 6;
  const barWidth = Math.max(1, Math.floor((barArea - spacing * (numBars - 1)) / numBars));
  const labelWidth = LABEL_WIDTH[granularity] ?? 14;
  const byWidth = barWidth > 0 ? Math.max(1, Math.ceil(labelWidth / (barWidth + spacing))) : 6;
  const maxLabels = granularity === 'hour' ? 6 : granularity === 'day' ? 15 : numBars;
  const byCount = Math.ceil(numBars / maxLabels);
  const interval = Math.max(byWidth, byCount);

  // Give shown labels enough space to span `interval` bars so they don't get clipped
  const shownLabelWidth = (barWidth + spacing) * interval - spacing;

  const chartData = dailySummaries.map(({ date, netSales }, i) => ({
    value: netSales,
    frontColor: '#CCFFCC',
    label: i % interval === 0 ? date : '',
    labelWidth: i % interval === 0 ? shownLabelWidth : barWidth,
  }));

  return (
    <Card title="Sales Overview">
      <View onLayout={(e) => onLayout(e.nativeEvent.layout.width)}>
        {containerWidth > 0 && (
          <BarChart
            key={`chart-${containerWidth}-${granularity}-${dailySummaries.length}`}
            data={chartData}
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
            maxValue={Math.max(...chartData.map((d) => d.value), 1) * 1.2}
            barBorderRadius={0}
            formatYLabel={formatYLabel}
          />
        )}
      </View>
    </Card>
  );
}
