import { cashCollected, cashLeft } from '@/features/reconciliation/utils';

describe('cashCollected', () => {
  test('sums only cash, whichever way the method is spelled', () => {
    expect(
      cashCollected([
        { payment_method: 'cash', transactions: 3, payment_amount: 1500 },
        { payment_method: 'paid_cash', transactions: 1, payment_amount: 250 },
        { payment_method: 'gcash', transactions: 2, payment_amount: 900 },
        { payment_method: 'bank', transactions: 1, payment_amount: 4000 },
      ]),
    ).toBe(1750);
  });

  test('no cash rows means nothing collected', () => {
    expect(cashCollected([])).toBe(0);
    expect(cashCollected([{ payment_method: 'gcash', transactions: 1, payment_amount: 100 }])).toBe(0);
  });
});

describe('cashLeft', () => {
  test('is cash collected minus expenses', () => {
    expect(cashLeft(1750, 600)).toBe(1150);
  });

  test('goes negative when expenses exceed cash taken in', () => {
    expect(cashLeft(500, 800)).toBe(-300);
  });
});
