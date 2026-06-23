import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getCategories, getItems, type Branch, type Category, type Item } from '@/lib/api';

type Props = {
  token: string | null;
  selectedBranch?: Branch | null;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useCatalog({ token, selectedBranch, loadBranches }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getItems(token, { branch_id: selectedBranch?.id }), getCategories(token), loadBranches(token)]).then(
        ([itemsRes, catsRes]) => {
          if (itemsRes.ok) setItems(itemsRes.data);
          if (catsRes.ok) setCategories(catsRes.data);
          setLoading(false);
        },
      );
    }, [token, selectedBranch, loadBranches]),
  );

  return { items, categories, loading };
}
