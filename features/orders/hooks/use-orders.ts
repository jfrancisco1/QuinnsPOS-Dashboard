import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getOrders, type Branch, type Order } from '@/lib/api';

const STATUS_TABS = ['All', 'Paid', 'Unpaid', 'Partial'];

type Props = {
  token: string | null;
  selectedBranch: Branch | null | undefined;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useOrders({ token, selectedBranch, loadBranches }: Props) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      Promise.all([getOrders(token), loadBranches(token)]).then(([result]) => {
        if (result.ok) {
          const sorted = [...result.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setAllOrders(sorted);
        }
        setLoading(false);
      });
    }, [token, loadBranches]),
  );

  const branchFiltered = selectedBranch
    ? allOrders.filter((o) => o.branch?.id === selectedBranch.id)
    : allOrders;

  const orders =
    statusTab === 0
      ? branchFiltered
      : branchFiltered.filter(
          (o) => o.paymentStatus?.toLowerCase() === STATUS_TABS[statusTab].toLowerCase(),
        );

  return { orders, loading, statusTab, setStatusTab, STATUS_TABS };
}
