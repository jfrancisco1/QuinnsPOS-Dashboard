import { useCallback, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { getOrders, getSalesByPaymentType, type Branch, type Order, type SalesByPaymentType } from '@/lib/api';
import { computeDateRange, getPeriodLabel, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';

export type PaidOrder = Order & { paidAt: string };

// GET /orders?date_basis=paid (shipped in bfb9678) filters server-side on the date each
// order most recently transitioned into its current paid status, restricted to orders
// currently in a paid status. We still read paymentHistory client-side to know exactly
// *when* each returned order was paid (for display/sort) — the server already guarantees
// every order it returns here has a paid transition, so no null-safety fallback is needed.
function latestPaidTransitionAt(order: Order): string {
  const paidTransitions = (order.paymentHistory ?? []).filter((h) => h.toStatus?.startsWith('paid'));
  const latest = paidTransitions.reduce((a, b) => (new Date(a.changedAt) > new Date(b.changedAt) ? a : b));
  return latest.changedAt;
}

// Streams paid orders page-by-page instead of waiting for the whole result to finish
// paginating — each page is merged in and handed to `onProgress` immediately, so the
// list fills in as data arrives instead of the screen sitting blank until the last page.
async function fetchPaidOrdersInRange(
  token: string,
  { from, to, branch_id }: { from: string; to: string; branch_id?: number },
  onProgress: (orders: PaidOrder[]) => void,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const accumulated: PaidOrder[] = [];
  let cursor: string | undefined;
  try {
    do {
      const result = await getOrders(token, { from, to, branch_id, date_basis: 'paid', cursor });
      if (!result.ok) return { ok: false, message: result.error.message };

      for (const o of result.data.data) {
        accumulated.push({ ...o, paidAt: latestPaidTransitionAt(o) });
      }
      accumulated.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
      onProgress([...accumulated]);

      cursor = result.data.hasMore ? (result.data.nextCursor ?? undefined) : undefined;
    } while (cursor);

    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

type Props = {
  token: string | null;
  selectedBranch: Branch | null | undefined;
};

export function useReconciliationData({ token, selectedBranch }: Props) {
  const [period, setPeriod] = useState<Period>('today');
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [salesByPayment, setSalesByPayment] = useState<SalesByPaymentType[]>([]);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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

      let cancelled = false;

      setLoading(true);
      setError(null);
      setOrdersLoading(true);
      setOrdersError(null);
      setPaidOrders([]);

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

      // Sales totals are a single request and gate the initial screen. The paid-orders
      // list is fetched separately below and streams in progressively, so a wide (e.g.
      // month-long) window doesn't hold the whole screen on a blank loading state.
      getSalesByPaymentType(token, 'custom', {
        from: fromStr,
        to: toStr,
        branch_id: selectedBranch?.id,
        date_basis: 'paid',
      })
        .then((salesResult) => {
          if (cancelled) return;
          if (!salesResult.ok) {
            setError(salesResult.error.message);
          } else {
            setSalesByPayment(salesResult.data);
          }
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : 'Unexpected error');
          setLoading(false);
        });

      fetchPaidOrdersInRange(token, { from: fromStr, to: toStr, branch_id: selectedBranch?.id }, (partial) => {
        if (cancelled) return;
        setPaidOrders(partial);
      })
        .then((result) => {
          if (cancelled) return;
          if (!result.ok) setOrdersError(result.message);
          setOrdersLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setOrdersError(e instanceof Error ? e.message : 'Unexpected error');
          setOrdersLoading(false);
        });

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, period, offset, customFrom, customTo, selectedBranch, reloadKey]),
  );

  function retry() {
    setReloadKey((k) => k + 1);
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

  const overallTotal = salesByPayment.reduce((sum, row) => sum + row.payment_amount, 0);
  const periodLabel = getPeriodLabel(period, offset, customFrom, customTo);
  const canGoForward = period !== 'custom' && offset < 0;
  const canGoBack = period !== 'custom';

  return {
    period,
    offset,
    setOffset,
    salesByPayment,
    paidOrders,
    overallTotal,
    loading,
    error,
    ordersLoading,
    ordersError,
    retry,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  };
}
