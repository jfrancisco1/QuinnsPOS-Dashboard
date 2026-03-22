import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getCategories, getItems, type Category, type Item } from '@/lib/api';

type Props = {
  token: string | null;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useCatalog({ token, loadBranches }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getItems(token), getCategories(token), loadBranches(token)]).then(
        ([itemsRes, catsRes]) => {
          if (itemsRes.ok) setItems(itemsRes.data);
          if (catsRes.ok) setCategories(catsRes.data);
          setLoading(false);
        },
      );
    }, [token, loadBranches]),
  );

  return { items, categories, loading };
}
