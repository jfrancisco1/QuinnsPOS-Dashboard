import { useCallback, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { getOrders, getSalesByPaymentType, type Branch, type Order, type SalesByPaymentType } from '@/lib/api';
import { computeDateRange, getPeriodLabel, parseLocalISO, toISO, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';

// The /orders endpoint has no paid-date filter (from/to only match createdAt), so to list orders
// paid within the selected period we widen the createdAt window and filter client-side using each
// order's paymentHistory. This misses orders that took longer than this to go from created to paid.
const PAID_LOOKBACK_DAYS = 30;

function subtractDays(iso: string, days: number): string {
  const d = parseLocalISO(iso);
  d.setDate(d.getDate() - days);
  return toISO(d);
}

// Matches the backend's date_basis=paid grouping, which buckets by Asia/Manila calendar day.
function manilaDateOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function paidDateOf(order: Order): string | null {
  const paidTransitions = (order.paymentHistory ?? []).filter((h) => h.toStatus?.startsWith('paid'));
  if (paidTransitions.length === 0) return null;
  const latest = paidTransitions.reduce((a, b) => (new Date(a.changedAt) > new Date(b.changedAt) ? a : b));
  return manilaDateOf(latest.changedAt);
}

async function fetchPaidOrdersInRange(
  token: string,
  { from, to, branch_id }: { from: string; to: string; branch_id?: number },
): Promise<Order[]> {
  const paddedFrom = subtractDays(from, PAID_LOOKBACK_DAYS);
  const all: Order[] = [];
  let cursor: string | undefined;
  do {
    const result = await getOrders(token, { from: paddedFrom, to, branch_id, cursor });
    if (!result.ok) break;
    all.push(...result.data.data);
    cursor = result.data.hasMore ? (result.data.nextCursor ?? undefined) : undefined;
  } while (cursor);

  return all
    .filter((o) => o.paymentStatus !== 'unpaid')
    .map((o) => ({ order: o, paidDate: paidDateOf(o) }))
    .filter((x): x is { order: Order; paidDate: string } => x.paidDate != null && x.paidDate >= from && x.paidDate <= to)
    .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
    .map((x) => x.order);
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
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

      Promise.all([
        getSalesByPaymentType(token, 'custom', {
          from: fromStr,
          to: toStr,
          branch_id: selectedBranch?.id,
          date_basis: 'paid',
        }),
        fetchPaidOrdersInRange(token, { from: fromStr, to: toStr, branch_id: selectedBranch?.id }),
      ]).then(([salesResult, orders]) => {
        if (salesResult.ok) setSalesByPayment(salesResult.data);
        setPaidOrders(orders);
        setLoading(false);
      });
    }, [token, period, offset, customFrom, customTo, selectedBranch]),
  );

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
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  };
}
