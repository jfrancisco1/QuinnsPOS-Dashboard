import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";

import { Card } from "@/components/ui/card";
import { fmtPeso, getPaymentIcon, paymentMethodKey } from "@/features/sales/utils";
import { type SalesByPaymentType } from "@/lib/api";

type Props = {
  salesByPayment: SalesByPaymentType[];
  title?: string;
  // When provided, rows become tappable (except "unpaid") and the matching row is highlighted.
  selectedMethod?: string | null;
  onSelectMethod?: (method: string) => void;
};

export function PaymentTypesCard({
  salesByPayment,
  title = 'Payment Types',
  selectedMethod,
  onSelectMethod,
}: Props) {
  const { colorScheme } = useColorScheme();
  const amountColor = colorScheme === 'dark' ? '#B060FF' : '#560591';
  if (salesByPayment.length === 0) return null;

  return (
    <Card title={title}>
      {salesByPayment.map((row, i) => {
        const { icon, color } = getPaymentIcon(row.payment_method);
        const key = paymentMethodKey(row.payment_method);
        const selectable = onSelectMethod != null && key !== "unpaid";
        const selected = selectable && selectedMethod === key;
        return (
          <View key={`${row.payment_method}-${i}`}>
            <TouchableOpacity
              disabled={!selectable}
              onPress={() => onSelectMethod?.(key)}
              activeOpacity={0.6}
              className={`-mx-2 flex-row items-center justify-between rounded-xl px-2 py-2.5 ${
                selected ? "bg-chip dark:bg-chip-dark" : ""
              }`}
            >
              <View className="flex-1 flex-row items-center gap-2">
                <View
                  className="h-6 w-6 items-center justify-center rounded-xl"
                  style={{ backgroundColor: color + "1A" }}
                >
                  <MaterialCommunityIcons name={icon} size={20} color={color} />
                </View>
                <View>
                  <Text className="text-sm font-semibold capitalize text-ink dark:text-white">
                    {row.payment_method.replace(/^paid_/i, "")}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted">
                    {row.transactions} transaction
                    {row.transactions !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold" style={{ color: amountColor }}>
                {fmtPeso(row.payment_amount)}
              </Text>
            </TouchableOpacity>
            {i < salesByPayment.length - 1 && (
              <View className="h-px bg-divide dark:bg-divide-dark" />
            )}
          </View>
        );
      })}
    </Card>
  );
}
