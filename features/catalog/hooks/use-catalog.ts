import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getCategories, getItems, type Branch, type Category, type Item } from '@/lib/api';
import { useReconnectKey } from '@/lib/network-status';

type Props = {
  token: string | null;
  selectedBranch?: Branch | null;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useCatalog({ token, selectedBranch, loadBranches }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const reconnectKey = useReconnectKey();

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
      // reconnectKey is a refetch trigger, not read inside the callback.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedBranch, loadBranches, reconnectKey]),
  );

  return { items, categories, loading };
}
