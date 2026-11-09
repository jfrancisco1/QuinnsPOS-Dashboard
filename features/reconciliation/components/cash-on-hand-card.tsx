import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { fmtPeso } from '@/features/sales/utils';
import { type ExpensesByCategory } from '@/lib/api';

type Props = {
  cashCollected: number;
  expenses: ExpensesByCategory | null;
  expensesError: string | null;
};

// Cash that should be left in the drawer: cash payments collected in the period minus the
// period's expenses. Expenses don't record a payment method, so all are counted as cash.
export function CashOnHandCard({ cashCollected, expenses, expensesError }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const expenseTotal = expenses?.total ?? 0;
  const cashLeft = cashCollected - expenseTotal;
  const breakdown = expenses?.breakdown ?? [];

  return (
    <Card title="Cash On Hand">
      <View className="flex-row items-center justify-between py-1.5">
        <Text className="text-sm text-ink dark:text-white">Cash collected</Text>
        <Text className="text-sm font-semibold text-ink dark:text-white">{fmtPeso(cashCollected)}</Text>
      </View>

      <TouchableOpacity
        disabled={breakdown.length === 0}
        onPress={() => setShowBreakdown((v) => !v)}
        activeOpacity={0.6}
        className="flex-row items-center justify-between py-1.5"
      >
        <Text className="text-sm text-ink dark:text-white">
          Less expenses
          {breakdown.length > 0 ? (
            <Text className="text-xs text-muted">{showBreakdown ? '  ▲' : '  ▼'}</Text>
          ) : null}
        </Text>
        <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
          {expensesError ? '—' : `− ${fmtPeso(expenseTotal)}`}
        </Text>
      </TouchableOpacity>

      {showBreakdown
        ? breakdown.map((row) => (
            <View key={row.categoryId ?? row.category} className="flex-row items-center justify-between py-1 pl-3">
              <Text className="flex-1 pr-3 text-xs text-muted" numberOfLines={1}>
                {row.category} · {row.transactions}
              </Text>
              <Text className="text-xs text-muted">{fmtPeso(row.amount)}</Text>
            </View>
          ))
        : null}

      <View className="my-2 h-px bg-divide dark:bg-divide-dark" />

      <View className="flex-row items-center justify-between py-1.5">
        <Text className="text-base font-bold text-ink dark:text-white">Cash left</Text>
        <Text
          className={`text-base font-bold ${
            cashLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-primary dark:text-primary-300'
          }`}
        >
          {expensesError ? '—' : fmtPeso(cashLeft)}
        </Text>
      </View>

      <Text className="mt-2 text-xs text-muted">
        {expensesError
          ? `Couldn't load expenses: ${expensesError}`
          : 'All expenses in this period are counted as paid from cash.'}
      </Text>
    </Card>
  );
}
