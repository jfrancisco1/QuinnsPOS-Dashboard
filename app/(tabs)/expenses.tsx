import { SectionList, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListItem } from '@/components/ui/list-item';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/context/auth-context';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { type Expense } from '@/lib/api';

function fmtPeso(amount: number) {
  return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ExpensesScreen() {
  const { token } = useAuth();
  const { expenses, loading } = useExpenses({ token });

  const sections = expenses.reduce<{ title: string; data: Expense[] }[]>(
    (acc, expense) => {
      const label = fmtDate(expense.expense_date);
      const existing = acc.find((s) => s.title === label);
      if (existing) {
        existing.data.push(expense);
      } else {
        acc.push({ title: label, data: [expense] });
      }
      return acc;
    },
    [],
  );

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <ScreenHeader title="Expenses">
        {expenses.length > 0 && (
          <Text className="mt-1 text-sm font-semibold text-white/80">
            Total: {fmtPeso(total)}
          </Text>
        )}
      </ScreenHeader>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted">Loading...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderSectionHeader={({ section }) => (
            <View className="border-b border-divide bg-page px-4 py-2 dark:border-divide-dark dark:bg-page-dark">
              <Text className="text-sm font-bold text-emerald">{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ListItem
              title={item.description}
              subtitle={item.note ?? undefined}
              right={
                <Text className="text-base font-bold text-zinc-900 dark:text-white">
                  {fmtPeso(Number(item.amount))}
                </Text>
              }
              onPress={() =>
                router.push({
                  pathname: '/edit-expense',
                  params: {
                    id: String(item.id),
                    description: item.description,
                    amount: String(item.amount),
                    expense_date: item.expense_date,
                    note: item.note ?? '',
                  },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-sm text-muted">No expenses yet</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        onPress={() => router.push('/new-expense')}
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        style={{ elevation: 6 }}
      >
        <IconSymbol name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
