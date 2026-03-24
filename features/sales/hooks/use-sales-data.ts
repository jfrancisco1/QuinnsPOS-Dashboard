import { useCallback, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import {
  getItems,
  getSalesByItem,
  getSalesByPaymentType,
  getSalesSummary,
  type Branch,
  type Item,
  type SalesByItem,
  type SalesByPaymentType,
  type SalesSummary,
} from '@/lib/api';
import { computeDateRange, getPeriodLabel, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';

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

type Props = {
  token: string | null;
  selectedBranch: Branch | null | undefined;
};

export function useSalesData({ token, selectedBranch }: Props) {
  const [period, setPeriod] = useState<Period>('today');
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [salesByItem, setSalesByItem] = useState<SalesByItem[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<number, Item>>(new Map());
  const [salesByPayment, setSalesByPayment] = useState<SalesByPaymentType[]>([]);
  const [dailySummaries, setDailySummaries] = useState<{ date: string; netSales: number }[]>([]);
  const [granularity, setGranularity] = useState<SalesSummary['group_by']>('hour');
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
        getSalesSummary(token, 'custom', { from: fromStr, to: toStr, branch_id: selectedBranch?.id }),
        getSalesByItem(token, 'custom', { from: fromStr, to: toStr, branch_id: selectedBranch?.id }),
        getSalesByPaymentType(token, 'custom', { from: fromStr, to: toStr, branch_id: selectedBranch?.id }),
        getItems(token),
      ]).then(([sumRes, itemsRes, paymentRes, allItemsRes]) => {
        if (sumRes.ok) {
          setSummary(sumRes.data);
          setGranularity(sumRes.data.group_by);
          setDailySummaries(
            sumRes.data.series.map(({ label, net_sales }) => ({
              date: formatSeriesLabel(label, sumRes.data.group_by),
              netSales: net_sales,
            })),
          );
        }
        if (itemsRes.ok) setSalesByItem(itemsRes.data);
        if (paymentRes.ok) setSalesByPayment(paymentRes.data);
        if (allItemsRes.ok) {
          setItemsMap(new Map(allItemsRes.data.map((it) => [it.id, it])));
        }
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

  const totalExpenses = summary?.expenses ?? 0;
  const grossProfit = summary?.grossProfit ?? 0;
  const periodLabel = getPeriodLabel(period, offset, customFrom, customTo);
  const canGoForward = period !== 'custom' && offset < 0;
  const canGoBack = period !== 'custom';

  return {
    period,
    setPeriod,
    offset,
    setOffset,
    customFrom,
    customTo,
    summary,
    salesByItem,
    itemsMap,
    salesByPayment,
    dailySummaries,
    granularity,
    loading,
    totalExpenses,
    grossProfit,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  };
}
