import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getExpenses, type Branch, type Expense } from '@/lib/api';

type Props = {
  token: string | null;
  selectedBranch?: Branch | null;
};

export function useExpenses({ token, selectedBranch }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const result = await getExpenses(token, { branch_id: selectedBranch?.id ?? undefined });
    if (result.ok) {
      const sorted = [...result.data].sort(
        (a, b) =>
          new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
      );
      setExpenses(sorted);
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [token, selectedBranch]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses]),
  );

  const onRefresh = useCallback(() => fetchExpenses(true), [fetchExpenses]);

  return { expenses, loading, refreshing, onRefresh };
}
