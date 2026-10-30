import { useCallback, useEffect, useMemo, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import {
  getItems,
  getLoadsSummary,
  getReadyOrders,
  getSalesByItem,
  getSalesByPaymentType,
  getSalesSummary,
  readFromCache,
  type ApiResult,
  type Branch,
  type Item,
  type LoadsSummary,
  type ReadyOrdersSummary,
  type SalesByItem,
  type SalesByPaymentType,
  type SalesSummary,
} from '@/lib/api';
import { isAddOnCategory } from '@/features/sales/utils';
import { cacheThenNetwork } from '@/lib/cache-then-network';
import { computeCompareRange, computeDateRange, getPeriodLabel, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';
import { useReconnectKey } from '@/lib/network-status';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSeriesLabel(label: string, groupBy: SalesSummary['group_by']): string {
  if (groupBy === 'day') return String(parseInt(label.split('-')[2], 10));
  if (groupBy === 'month') return MONTHS_SHORT[parseInt(label.split('-')[1], 10) - 1];
  if (groupBy === 'hour') {
    const h = parseInt(label.split(':')[0], 10);
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  }
  return label; // year
}

function selectionRange(period: Period, offset: number, customFrom: string, customTo: string) {
  return period === 'custom' ? { from: customFrom, to: customTo } : computeDateRange(period, offset);
}

// The item catalog only supplies names, colors and categories here, so it's
// fetched once per session (and again on pull-to-refresh), not on every visit.
let catalogRequest: { token: string; promise: Promise<ApiResult<Item[]>> } | null = null;

function loadCatalog(token: string, force: boolean): Promise<ApiResult<Item[]>> {
  if (force || !catalogRequest || catalogRequest.token !== token) {
    catalogRequest = { token, promise: getItems(token) };
  }
  return catalogRequest.promise;
}

// Each card's data, tagged with the selection (period + branch) it belongs to,
// so data from the previous selection can stay on screen, faded, until the new
// one arrives.
type Keyed<T> = { key: string; data: T };

type Props = {
  token: string | null;
  selectedBranch: Branch | null | undefined;
};

export function useSalesData({ token, selectedBranch }: Props) {
  const [period, setPeriod] = useState<Period>('today');
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState<Keyed<{ summary: SalesSummary; compareLabel: string | null }> | null>(null);
  const [salesByItem, setSalesByItem] = useState<Keyed<SalesByItem[]> | null>(null);
  const [salesByPayment, setSalesByPayment] = useState<Keyed<SalesByPaymentType[]> | null>(null);
  const [loads, setLoads] = useState<Keyed<LoadsSummary> | null>(null);
  const [readyOrders, setReadyOrders] = useState<Keyed<ReadyOrdersSummary> | null>(null);
  const [itemsMap, setItemsMap] = useState<Map<number, Item>>(new Map());
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [error, setError] = useState<Keyed<string> | null>(null);
  const reconnectKey = useReconnectKey();

  const range = selectionRange(period, offset, customFrom, customTo);
  const currentKey = `${range.from}|${range.to}|${selectedBranch?.id ?? 'all'}`;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const toMap = (items: Item[]) => new Map(items.map((it) => [it.id, it]));
    readFromCache(() => getItems(token)).then((cached) => {
      if (!cancelled && cached) setItemsMap((prev) => (prev.size > 0 ? prev : toMap(cached.data)));
    });
    loadCatalog(token, refreshTick > 0).then((res) => {
      if (!cancelled && res.ok) setItemsMap(toMap(res.data));
    });
    return () => {
      cancelled = true;
    };
  }, [token, refreshTick]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      const pending = takePendingDateRange();
      if (pending) {
        // Changing the selection re-runs this effect with the new range.
        setPeriod('custom');
        setCustomFrom(pending.from);
        setCustomTo(pending.to);
        setOffset(0);
        return;
      }

      let cancelled = false;
      const { from, to } = selectionRange(period, offset, customFrom, customTo);
      const key = `${from}|${to}|${selectedBranch?.id ?? 'all'}`;
      const branchId = selectedBranch?.id;
      const compare = computeCompareRange(period, offset, customFrom, customTo);
      const keyed = <T,>(set: (value: Keyed<T>) => void) => (data: T) => {
        if (!cancelled) set({ key, data });
      };

      setUpdating(true);
      setError(null);

      Promise.all([
        cacheThenNetwork(
          () => getSalesSummary(token, 'custom', { from, to, branch_id: branchId, compare_from: compare?.from, compare_to: compare?.to }),
          keyed<SalesSummary>((value) => setSummary({ key: value.key, data: { summary: value.data, compareLabel: compare?.label ?? null } })),
        ),
        cacheThenNetwork(() => getSalesByItem(token, 'custom', { from, to, branch_id: branchId }), keyed(setSalesByItem)),
        cacheThenNetwork(() => getSalesByPaymentType(token, 'custom', { from, to, branch_id: branchId }), keyed(setSalesByPayment)),
        cacheThenNetwork(() => getLoadsSummary(token, { from, to, branch_id: branchId }), keyed(setLoads)),
        cacheThenNetwork(() => getReadyOrders(token, { branch_id: branchId }), keyed(setReadyOrders)),
      ]).then(([summaryRes]) => {
        if (cancelled) return;
        if (!summaryRes.ok) setError({ key, data: summaryRes.error.message });
        setUpdating(false);
        setRefreshing(false);
      });

      return () => {
        cancelled = true;
      };
      // reconnectKey and refreshTick are refetch triggers, not read inside the callback.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, period, offset, customFrom, customTo, selectedBranch, reconnectKey, refreshTick]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshTick((t) => t + 1);
  }, []);

  const retry = useCallback(() => setRefreshTick((t) => t + 1), []);

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

  // Add-ons (e.g. fabric conditioner, extra rinse) aren't wash loads —
  // exclude them from the Loads count and its breakdown.
  const loadsBreakdown = useMemo(
    () =>
      (loads?.data.breakdown ?? []).filter(
        (row) => !isAddOnCategory(itemsMap.get(Number(row.itemId))?.category?.name),
      ),
    [loads, itemsMap],
  );

  const salesSummary = summary?.data.summary ?? null;
  const granularity = salesSummary?.group_by ?? 'hour';
  const dailySummaries = useMemo(
    () =>
      (salesSummary?.series ?? []).map(({ label, net_sales }) => ({
        date: formatSeriesLabel(label, granularity),
        netSales: net_sales,
      })),
    [salesSummary, granularity],
  );

  // Which cards have data for the current selection; the rest show a skeleton
  // rather than the previous selection's numbers.
  const ready = {
    summary: summary?.key === currentKey,
    salesByItem: salesByItem?.key === currentKey,
    salesByPayment: salesByPayment?.key === currentKey,
    loads: loads?.key === currentKey,
    readyOrders: readyOrders?.key === currentKey,
  };
  const errorMessage = error?.key === currentKey && !ready.summary ? error.data : null;

  return {
    period,
    setPeriod,
    offset,
    setOffset,
    customFrom,
    customTo,
    summary: salesSummary,
    compareLabel: summary?.data.compareLabel ?? null,
    readyOrders: readyOrders?.data ?? null,
    salesByItem: salesByItem?.data ?? [],
    itemsMap,
    salesByPayment: salesByPayment?.data ?? [],
    totalLoads: loadsBreakdown.reduce((sum, row) => sum + row.qty, 0),
    loadsOrderCount: loads?.data.orderCount ?? 0,
    loadsBreakdown,
    ordersByFulfillment: loads?.data.ordersByFulfillment ?? {},
    dailySummaries,
    granularity,
    ready,
    updating,
    refreshing,
    onRefresh,
    errorMessage,
    retry,
    totalExpenses: salesSummary?.expenses ?? 0,
    grossProfit: salesSummary?.grossProfit ?? 0,
    periodLabel: getPeriodLabel(period, offset, customFrom, customTo),
    canGoForward: period !== 'custom' && offset < 0,
    canGoBack: period !== 'custom',
    handlePeriodSelect,
  };
}
