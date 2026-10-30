import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getCategories, getItems, type Branch, type Category, type Item } from '@/lib/api';
import { cacheThenNetwork } from '@/lib/cache-then-network';
import { useReconnectKey } from '@/lib/network-status';

type Props = {
  token: string | null;
  selectedBranch?: Branch | null;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useCatalog({ token, selectedBranch, loadBranches }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Branch whose items are on screen (saved copy or server), and the last load
  // error, tagged with its branch.
  const [shownBranchKey, setShownBranchKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const reconnectKey = useReconnectKey();
  const branchKey = String(selectedBranch?.id ?? 'all');

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      const key = String(selectedBranch?.id ?? 'all');
      setUpdating(true);
      setError(null);
      loadBranches(token);
      Promise.all([
        cacheThenNetwork(
          () => getItems(token, { branch_id: selectedBranch?.id }),
          (data) => {
            if (cancelled) return;
            setItems(data);
            setShownBranchKey(key);
          },
        ),
        cacheThenNetwork(
          () => getCategories(token),
          (data) => {
            if (!cancelled) setCategories(data);
          },
        ),
      ]).then(([itemsRes]) => {
        if (cancelled) return;
        if (!itemsRes.ok) setError({ key, message: itemsRes.error.message });
        setUpdating(false);
      });
      return () => {
        cancelled = true;
      };
      // reconnectKey and retryTick are refetch triggers, not read inside the callback.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedBranch, loadBranches, reconnectKey, retryTick]),
  );

  const showingCurrent = shownBranchKey === branchKey;

  return {
    items,
    categories,
    // No items for this branch yet (the list may still hold the previous one's).
    loading: !showingCurrent,
    updating,
    errorMessage: error?.key === branchKey && !showingCurrent ? error.message : null,
    retry: () => setRetryTick((t) => t + 1),
  };
}
