import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { fmtPeso, getPaymentIcon } from '@/features/sales/utils';
import { type SalesByPaymentType } from '@/lib/api';

type Props = {
  salesByPayment: SalesByPaymentType[];
};

export function PaymentTypesCard({ salesByPayment }: Props) {
  if (salesByPayment.length === 0) return null;

  return (
    <Card title="Payment Types">
      {salesByPayment.map((row, i) => {
        const { icon, color } = getPaymentIcon(row.payment_method);
        return (
          <View key={row.payment_method}>
            <View className="flex-row items-center justify-between py-2.5">
              <View className="flex-1 flex-row items-center gap-3 pr-4">
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: color + '1A' }}
                >
                  <MaterialCommunityIcons name={icon} size={20} color={color} />
                </View>
                <View>
                  <Text className="text-sm font-semibold capitalize text-ink dark:text-white">
                    {row.payment_method.replace(/^paid_/i, '')}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted">
                    {row.transactions} transaction{row.transactions !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary">{fmtPeso(row.net_amount)}</Text>
            </View>
            {i < salesByPayment.length - 1 && (
              <View className="h-px bg-divide dark:bg-divide-dark" />
            )}
          </View>
        );
      })}
    </Card>
  );
}
