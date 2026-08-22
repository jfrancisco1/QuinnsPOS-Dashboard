import { Text, View } from 'react-native';

import { router } from 'expo-router';

import { Badge } from '@/components/ui/badge';
import { ListItem } from '@/components/ui/list-item';
import { fmtPeso } from '@/features/sales/utils';
import { type Expense } from '@/lib/api';

type Props = {
  expense: Expense;
};

export function ExpenseListItem({ expense }: Props) {
  return (
    <ListItem
      title={expense.description}
      subtitle={expense.note ?? undefined}
      right={
        <View className="items-end gap-1">
          <Text className="text-base font-bold text-zinc-900 dark:text-white">
            {fmtPeso(Number(expense.amount))}
          </Text>
          <Badge label={expense.category?.name ?? 'Uncategorized'} />
        </View>
      }
      onPress={() =>
        router.push({
          pathname: '/edit-expense',
          params: {
            id: String(expense.id),
            description: expense.description,
            amount: String(expense.amount),
            expense_date: expense.expense_date,
            note: expense.note ?? '',
            expense_category_id: expense.expense_category_id != null ? String(expense.expense_category_id) : '',
          },
        })
      }
    />
  );
}
