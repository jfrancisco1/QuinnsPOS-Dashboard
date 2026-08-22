import { useCallback, useMemo, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { getExpenseCategories, getExpenses, type Branch, type Expense, type ExpenseCategory } from '@/lib/api';
import { computeDateRange, getPeriodLabel, isInDateRange, parseLocalISO, toISO, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type TrendPoint = { label: string; value: number };
export type CategoryBreakdownRow = { id: number | null; name: string; amount: number; count: number };

function bucketByDay(expenses: Expense[], from: string, to: string): TrendPoint[] {
  const buckets = new Map<string, number>();
  const end = parseLocalISO(to);
  for (const d = parseLocalISO(from); d <= end; d.setDate(d.getDate() + 1)) {
    buckets.set(toISO(d), 0);
  }
  for (const e of expenses) {
    if (buckets.has(e.expense_date)) {
      buckets.set(e.expense_date, (buckets.get(e.expense_date) ?? 0) + Number(e.amount));
    }
  }
  return Array.from(buckets.entries()).map(([iso, value]) => ({
    label: String(parseInt(iso.split('-')[2], 10)),
    value,
  }));
}

function bucketByMonth(expenses: Expense[], from: string, to: string): TrendPoint[] {
  const buckets = new Map<string, number>();
  const fromD = parseLocalISO(from);
  const toD = parseLocalISO(to);
  const end = new Date(toD.getFullYear(), toD.getMonth(), 1);
  for (const d = new Date(fromD.getFullYear(), fromD.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
  }
  for (const e of expenses) {
    const key = e.expense_date.slice(0, 7);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(e.amount));
  }
  return Array.from(buckets.entries()).map(([key, value]) => ({
    label: MONTHS_SHORT[parseInt(key.split('-')[1], 10) - 1],
    value,
  }));
}

function computeTrend(expenses: Expense[], from: string, to: string): TrendPoint[] {
  if (!from || !to) return [];
  const dayCount = Math.round((parseLocalISO(to).getTime() - parseLocalISO(from).getTime()) / 86400000) + 1;
  return dayCount <= 31 ? bucketByDay(expenses, from, to) : bucketByMonth(expenses, from, to);
}

function computeCategoryBreakdown(expenses: Expense[]): CategoryBreakdownRow[] {
  const map = new Map<string, CategoryBreakdownRow>();
  for (const e of expenses) {
    const key = e.category?.name ?? 'Uncategorized';
    const existing = map.get(key);
    if (existing) {
      existing.amount += Number(e.amount);
      existing.count += 1;
    } else {
      map.set(key, { id: e.expense_category_id, name: key, amount: Number(e.amount), count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

type Props = {
  token: string | null;
  selectedBranch?: Branch | null;
  loadBranches: (token: string) => Promise<unknown>;
};

export function useExpenses({ token, selectedBranch, loadBranches }: Props) {
  const [period, setPeriod] = useState<Period>('this_month');
  const [offset, setOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const [expensesRes, categoriesRes] = await Promise.all([
      getExpenses(token, { branch_id: selectedBranch?.id ?? undefined }),
      getExpenseCategories(token),
    ]);
    if (expensesRes.ok) {
      const sorted = [...expensesRes.data].sort(
        (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
      );
      setExpenses(sorted);
    }
    if (categoriesRes.ok) {
      setCategories([...categoriesRes.data].sort((a, b) => a.sort_order - b.sort_order));
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [token, selectedBranch]);

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
      fetchExpenses();
    }, [token, loadBranches, fetchExpenses]),
  );

  const onRefresh = useCallback(() => fetchExpenses(true), [fetchExpenses]);

  const range = useMemo(
    () => (period === 'custom' ? { from: customFrom, to: customTo } : computeDateRange(period, offset)),
    [period, offset, customFrom, customTo],
  );

  const filtered = useMemo(() => {
    let list = expenses;
    if (range.from && range.to) {
      list = list.filter((e) => isInDateRange(e.expense_date, range.from, range.to));
    }
    if (selectedCategoryId !== 'all') {
      list = list.filter((e) => e.expense_category_id === selectedCategoryId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.note ?? '').toLowerCase().includes(q) ||
          String(e.amount).includes(q),
      );
    }
    return list;
  }, [expenses, range, selectedCategoryId, searchQuery]);

  const total = useMemo(() => filtered.reduce((sum, e) => sum + Number(e.amount), 0), [filtered]);
  const trendSeries = useMemo(() => computeTrend(filtered, range.from, range.to), [filtered, range]);
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(filtered), [filtered]);

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
    expenses: filtered,
    categories,
    total,
    count: filtered.length,
    trendSeries,
    categoryBreakdown,
    period,
    offset,
    setOffset,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    loading,
    refreshing,
    onRefresh,
  };
}
