import { useCallback, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import {
  getExpenses,
  getItems,
  getSalesByItem,
  getSalesByPaymentType,
  getSalesSummary,
  type Branch,
  type Expense,
  type Item,
  type SalesByItem,
  type SalesByPaymentType,
  type SalesSummary,
} from '@/lib/api';
import {
  computeDateRange,
  getPeriodLabel,
  isInDateRange,
  parseLocalISO,
  toISO,
  type Period,
} from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesByItem, setSalesByItem] = useState<SalesByItem[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<number, Item>>(new Map());
  const [salesByPayment, setSalesByPayment] = useState<SalesByPaymentType[]>([]);
  const [dailySummaries, setDailySummaries] = useState<{ date: string; netSales: number }[]>([]);
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

      const today = toISO(new Date());
      type SliceKey = { from: string; to: string; label: string };
      const sliceKeys: SliceKey[] = [];
      const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      if (activePeriod === 'this_week') {
        const start = parseLocalISO(fromStr);
        for (let i = 0; i < 7; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
          const iso = toISO(d);
          sliceKeys.push({ from: iso, to: iso, label: String(d.getDate()) });
        }
      } else if (activePeriod === 'this_month') {
        const start = parseLocalISO(fromStr);
        const end = parseLocalISO(toStr);
        for (let i = 0; ; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
          if (d > end) break;
          const iso = toISO(d);
          if (iso > today) break;
          sliceKeys.push({ from: iso, to: iso, label: String(d.getDate()) });
        }
      } else if (activePeriod === 'this_year') {
        const year = parseLocalISO(fromStr).getFullYear();
        for (let m = 0; m < 12; m++) {
          const first = `${year}-${String(m + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(year, m + 1, 0);
          sliceKeys.push({ from: first, to: toISO(lastDay), label: MONTHS_SHORT[m] });
        }
      } else if (activePeriod === 'custom' && activeFrom && activeTo) {
        const cfrom = parseLocalISO(activeFrom);
        const cto = parseLocalISO(activeTo);
        if (cfrom.getFullYear() !== cto.getFullYear()) {
          for (let y = cfrom.getFullYear(); y <= cto.getFullYear(); y++) {
            sliceKeys.push({ from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) });
          }
        } else if (cfrom.getMonth() !== cto.getMonth()) {
          for (let m = cfrom.getMonth(); m <= cto.getMonth(); m++) {
            const first = `${cfrom.getFullYear()}-${String(m + 1).padStart(2, '0')}-01`;
            const last = toISO(new Date(cfrom.getFullYear(), m + 1, 0));
            sliceKeys.push({ from: first, to: last, label: MONTHS_SHORT[m] });
          }
        } else {
          for (let i = 0; ; i++) {
            const d = new Date(cfrom.getFullYear(), cfrom.getMonth(), cfrom.getDate() + i);
            if (d > cto) break;
            sliceKeys.push({ from: toISO(d), to: toISO(d), label: String(d.getDate()) });
          }
        }
      }

      const baseRequests = Promise.all([
        getSalesSummary(token, 'custom', { from: fromStr, to: toStr, branch_id: selectedBranch?.id }),
        getExpenses(token),
        getSalesByItem(token, 'custom', { from: fromStr, to: toStr, branch_id: selectedBranch?.id }),
        getSalesByPaymentType(token, 'custom', { from: fromStr, to: toStr, branch_id: selectedBranch?.id }),
        getItems(token),
      ]);

      const sliceRequests =
        sliceKeys.length > 0
          ? Promise.all(
              sliceKeys.map((s) =>
                getSalesSummary(token, 'custom', {
                  from: s.from,
                  to: s.to,
                  branch_id: selectedBranch?.id,
                }),
              ),
            )
          : Promise.resolve([] as Awaited<ReturnType<typeof getSalesSummary>>[]);

      Promise.all([baseRequests, sliceRequests]).then(
        ([[sumRes, expRes, itemsRes, paymentRes, allItemsRes], sliceResults]) => {
          if (sumRes.ok) setSummary(sumRes.data);
          if (expRes.ok) setExpenses(expRes.data);
          if (itemsRes.ok) setSalesByItem(itemsRes.data);
          if (paymentRes.ok) setSalesByPayment(paymentRes.data);
          if (allItemsRes.ok) {
            setItemsMap(new Map(allItemsRes.data.map((it) => [it.id, it])));
          }
          if (sliceKeys.length > 0) {
            setDailySummaries(
              sliceKeys.map((s, i) => ({
                date: s.label,
                netSales: sliceResults[i]?.ok ? sliceResults[i].data.netSales : 0,
              })),
            );
          } else {
            setDailySummaries([]);
          }
          setLoading(false);
        },
      );
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

  let expenseFrom = customFrom;
  let expenseTo = customTo;
  if (period !== 'custom') {
    const range = computeDateRange(period, offset);
    expenseFrom = range.from;
    expenseTo = range.to;
  }

  const totalExpenses = expenses
    .filter((e) => isInDateRange(e.expense_date, expenseFrom, expenseTo))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const grossProfit = summary?.grossProfit ?? 0;
  const netProfit = grossProfit - totalExpenses;
  const periodLabel = getPeriodLabel(period, offset, customFrom, customTo);
  const canGoForward = period !== 'custom' && offset < 0;
  const canGoBack = period !== 'custom';

  const isSingleDay =
    period === 'today' ||
    (period === 'custom' && customFrom !== '' && customFrom === customTo);

  const isTimeSeries =
    period === 'this_week' ||
    period === 'this_month' ||
    period === 'this_year' ||
    (period === 'custom' && dailySummaries.length > 0);

  const customGranularity: 'day' | 'month' | 'year' = (() => {
    if (period !== 'custom' || !customFrom || !customTo) return 'day';
    const f = parseLocalISO(customFrom);
    const t = parseLocalISO(customTo);
    if (f.getFullYear() !== t.getFullYear()) return 'year';
    if (f.getMonth() !== t.getMonth()) return 'month';
    return 'day';
  })();

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
    loading,
    totalExpenses,
    grossProfit,
    netProfit,
    periodLabel,
    canGoForward,
    canGoBack,
    isSingleDay,
    isTimeSeries,
    customGranularity,
    handlePeriodSelect,
  };
}
