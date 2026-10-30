import { useCallback, useEffect, useRef, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { getOrders, type Branch, type Order } from '@/lib/api';
import { cacheThenNetwork } from '@/lib/cache-then-network';
import { computeDateRange, getPeriodLabel, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';
import { useReconnectKey } from '@/lib/network-status';

const STATUS_TABS = ['All', 'Paid', 'Unpaid'];

type Props = {
  token: string | null;
  selectedBranch: Branch | null | undefined;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useOrders({ token, selectedBranch, loadBranches }: Props) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  // Key of the request whose results are on screen; `loading` is derived from
  // it rather than set synchronously inside the fetch effect.
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusTab, setStatusTab] = useState(0);
  const [period, setPeriod] = useState<Period>('today');
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [focusTick, setFocusTick] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // Selection whose orders are on screen (from the saved copy or the server),
  // and the last load error, tagged with its request.
  const [shownKey, setShownKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const reconnectKey = useReconnectKey();

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

  const selectionKey = JSON.stringify([
    token,
    period,
    offset,
    customFrom,
    customTo,
    selectedBranch?.id,
    debouncedSearch,
    statusTab,
  ]);
  const requestKey = JSON.stringify([focusTick, reconnectKey, refreshTick, selectionKey]);
  const updating = loadedRequestKey !== requestKey;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

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

    const params = fetchParamsRef.current;
    cacheThenNetwork(
      () => getOrders(token, params),
      (page) => {
        if (cancelled) return;
        const sorted = [...page.data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const filtered = statusTab === 1 ? sorted.filter((o) => o.paymentStatus !== 'unpaid') : sorted;
        setAllOrders(filtered);
        setShownKey(selectionKey);
        nextCursorRef.current = page.nextCursor;
        hasMoreRef.current = page.hasMore;
      },
    ).then((result) => {
      if (cancelled) return;
      // Tagged with the request, so a retry or refocus hides the error while it loads again.
      if (!result.ok) setError({ key: requestKey, message: result.error.message });
      setLoadedRequestKey(requestKey);
      setRefreshing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [requestKey, selectionKey, focusTick, reconnectKey, token, period, offset, customFrom, customTo, selectedBranch, debouncedSearch, statusTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshTick((t) => t + 1);
  }, []);

  const retry = useCallback(() => setRefreshTick((t) => t + 1), []);

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

  const showingCurrent = shownKey === selectionKey;

  return {
    orders: allOrders,
    // No orders for this selection yet (the list may still hold the previous one's).
    loading: !showingCurrent,
    updating,
    refreshing,
    onRefresh,
    errorMessage: error?.key === requestKey && !showingCurrent ? error.message : null,
    retry,
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
