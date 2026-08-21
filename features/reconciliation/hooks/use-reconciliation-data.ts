import { useCallback, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { getSalesByPaymentType, type Branch, type SalesByPaymentType } from '@/lib/api';
import { computeDateRange, getPeriodLabel, type Period } from '@/lib/date-helpers';
import { takePendingDateRange } from '@/lib/date-range-store';

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

      getSalesByPaymentType(token, 'custom', {
        from: fromStr,
        to: toStr,
        branch_id: selectedBranch?.id,
        date_basis: 'paid',
      }).then((result) => {
        if (result.ok) setSalesByPayment(result.data);
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
    overallTotal,
    loading,
    periodLabel,
    canGoForward,
    canGoBack,
    handlePeriodSelect,
  };
}
