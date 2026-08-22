import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getExpenseCategories, type ExpenseCategory } from '@/lib/api';

type Props = {
  token: string | null;
};

export function useExpenseCategories({ token }: Props) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      getExpenseCategories(token).then((result) => {
        if (result.ok) {
          setCategories([...result.data].sort((a, b) => a.sort_order - b.sort_order));
        }
        setLoading(false);
      });
    }, [token]),
  );

  return { categories, loading };
}
