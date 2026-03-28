import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getExpenses, type Expense } from '@/lib/api';

type Props = {
  token: string | null;
};

export function useExpenses({ token }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      getExpenses(token).then((result) => {
        if (result.ok) {
          const sorted = [...result.data].sort(
            (a, b) =>
              new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
          );
          setExpenses(sorted);
        }
        setLoading(false);
      });
    }, [token]),
  );

  return { expenses, loading };
}
