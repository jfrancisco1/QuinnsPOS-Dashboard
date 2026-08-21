import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [focusTick, setFocusTick] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const fetchParamsRef = useRef<{ from: string; to: string; branch_id?: number; search?: string; payment_status?: string }>({
    from: '',
    to: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (token) loadBranches(token);
      const pending = takePendingDateRange();
      if (pending) {
        setPeriod('custom');
        setCustomFrom(pending.from);
        setCustomTo(pending.to);
        setOffset(0);
      }
      setFocusTick((t) => t + 1);
    }, [token, loadBranches]),
  );

  useEffect(() => {
    if (!token) return;

    setLoading(true);

    let fromStr: string;
    let toStr: string;
    if (period === 'custom') {
      fromStr = customFrom;
      toStr = customTo;
    } else {
      const range = computeDateRange(period, offset);
      fromStr = range.from;
      toStr = range.to;
    }

    const paymentStatusParam = statusTab === 2 ? 'unpaid' : undefined;

    fetchParamsRef.current = {
      from: fromStr,
      to: toStr,
      branch_id: selectedBranch?.id,
      search: debouncedSearch || undefined,
      payment_status: paymentStatusParam,
    };
    nextCursorRef.current = null;
    hasMoreRef.current = false;

    getOrders(token, fetchParamsRef.current).then((result) => {
      if (result.ok) {
        const sorted = [...result.data.data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const filtered = statusTab === 1 ? sorted.filter((o) => o.paymentStatus !== 'unpaid') : sorted;
        setAllOrders(filtered);
        nextCursorRef.current = result.data.nextCursor;
        hasMoreRef.current = result.data.hasMore;
      }
      setLoading(false);
    });
  }, [focusTick, token, period, offset, customFrom, customTo, selectedBranch, debouncedSearch, statusTab]);

  async function loadMore() {
    if (!token || !hasMoreRef.current || !nextCursorRef.current || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const result = await getOrders(token, {
      ...fetchParamsRef.current,
      cursor: nextCursorRef.current,
    });
    if (result.ok) {
      const sorted = [...result.data.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const filtered = statusTab === 1 ? sorted.filter((o) => o.paymentStatus !== 'unpaid') : sorted;
      setAllOrders((prev) => {
        const seen = new Set(prev.map((o) => o.orderNumber));
        return [...prev, ...filtered.filter((o) => !seen.has(o.orderNumber))];
      });
      nextCursorRef.current = result.data.nextCursor;
      hasMoreRef.current = result.data.hasMore;
    }
    loadingMoreRef.current = false;
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

  const periodLabel = getPeriodLabel(period, offset, customFrom, customTo);
  const canGoForward = period !== 'custom' && offset < 0;
  const canGoBack = period !== 'custom';

  return {
    orders: allOrders,
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
    searchQuery,
    setSearchQuery,
  };
}
