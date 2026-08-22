import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Card } from '@/components/ui/card';
import { type TrendPoint } from '@/features/expenses/hooks/use-expenses';

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
  trendSeries: TrendPoint[];
  containerWidth: number;
  onLayout: (width: number) => void;
};

export function ExpenseTrendChart({ trendSeries, containerWidth, onLayout }: Props) {
  const chartArea = Math.max(containerWidth - Y_AXIS_WIDTH, 0);
  const numPoints = Math.max(trendSeries.length, 1);
  const spacing = numPoints > 1 ? chartArea / (numPoints - 1 + (numPoints > 15 ? 0 : 1)) : chartArea;
  const maxLabels = 10;
  const interval = Math.max(1, Math.ceil(numPoints / maxLabels));

  const chartData = trendSeries.map(({ label, value }, i) => ({
    value,
    label: i % interval === 0 ? label : '',
  }));

  const maxValue = Math.max(...trendSeries.map((d) => d.value), 1) * 1.2;

  return (
    <Card title="Expense Trend">
      <View onLayout={(e) => onLayout(e.nativeEvent.layout.width)}>
        {containerWidth > 0 && trendSeries.length > 0 ? (
          <LineChart
            key={`trend-${containerWidth}-${trendSeries.length}`}
            data={chartData}
            width={chartArea}
            height={160}
            spacing={spacing}
            initialSpacing={8}
            endSpacing={8}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={chartAxisStyle}
            xAxisLabelTextStyle={chartXLabelStyle}
            noOfSections={4}
            maxValue={maxValue}
            formatYLabel={formatYLabel}
            color="#9130F0"
            thickness={2}
            curved
            areaChart
            startFillColor="#9130F0"
            endFillColor="#9130F0"
            startOpacity={0.25}
            endOpacity={0.02}
            dataPointsColor="#9130F0"
            dataPointsRadius={3}
          />
        ) : (
          <Text className="py-8 text-center text-sm text-muted">No expenses in this range</Text>
        )}
      </View>
    </Card>
  );
}
