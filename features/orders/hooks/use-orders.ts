import { useCallback, useRef, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { getOrders, type Branch, type Order } from '@/lib/api';
import { computeDateRange, getPeriodLabel, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';

const STATUS_TABS = ['All', 'Paid', 'Unpaid'];

type Props = {
  token: string | null;
  selectedBranch: Branch | null | undefined;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useOrders({ token, selectedBranch, loadBranches }: Props) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusTab, setStatusTab] = useState(0);
  const [period, setPeriod] = useState<Period>('today');
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const fetchParamsRef = useRef<{ from: string; to: string; branch_id?: number }>({
    from: '',
    to: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      const pending = takePendingDateRange();
      let activePeriod: Period = period;
      let activeFrom = customFrom;
      let activeTo = customTo;
      let activeOffset = offset;

      if (pending) {
        activePeriod = 'custom';
        activeFrom = pending.from;
        activeTo = pending.to;
        activeOffset = 0;
        setPeriod('custom');
        setCustomFrom(pending.from);
        setCustomTo(pending.to);
        setOffset(0);
      }

      setLoading(true);

      let fromStr: string;
      let toStr: string;
      if (activePeriod === 'custom') {
        fromStr = activeFrom;
        toStr = activeTo;
      } else {
        const range = computeDateRange(activePeriod, activeOffset);
        fromStr = range.from;
        toStr = range.to;
      }

      fetchParamsRef.current = { from: fromStr, to: toStr, branch_id: selectedBranch?.id };
      nextCursorRef.current = null;
      hasMoreRef.current = false;

      Promise.all([
        getOrders(token, fetchParamsRef.current),
        loadBranches(token),
      ]).then(([result]) => {
        if (result.ok) {
          const sorted = [...result.data.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setAllOrders(sorted);
          nextCursorRef.current = result.data.nextCursor;
          hasMoreRef.current = result.data.hasMore;
        }
        setLoading(false);
      });
    }, [token, period, offset, customFrom, customTo, selectedBranch, loadBranches]),
  );

  async function loadMore() {
    if (!token || !hasMoreRef.current || !nextCursorRef.current || loadingMore) return;

    setLoadingMore(true);
    const result = await getOrders(token, {
      ...fetchParamsRef.current,
      cursor: nextCursorRef.current,
    });
    if (result.ok) {
      const sorted = [...result.data.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setAllOrders((prev) => [...prev, ...sorted]);
      nextCursorRef.current = result.data.nextCursor;
      hasMoreRef.current = result.data.hasMore;
    }
    setLoadingMore(false);
  }

  function handlePeriodSelect(key: Period) {
    if (key === 'custom') {
      router.push('/date-range');
    } else {
      setPeriod(key);
      setOffset(0);
      setCustomFrom('');
      setCustomTo('');
    }
  }

  const orders =
    statusTab === 0
      ? allOrders
      : statusTab === 1
        ? allOrders.filter((o) => o.paymentStatus?.toLowerCase() !== 'unpaid')
        : allOrders.filter((o) => o.paymentStatus?.toLowerCase() === 'unpaid');

  const periodLabel = getPeriodLabel(period, offset, customFrom, customTo);
  const canGoForward = period !== 'custom' && offset < 0;
  const canGoBack = period !== 'custom';

  return {
    orders,
    loading,
    loadingMore,
    loadMore,
    statusTab,
    setStatusTab,
    STATUS_TABS,
    period,
    offset,
    setOffset,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  };
}
