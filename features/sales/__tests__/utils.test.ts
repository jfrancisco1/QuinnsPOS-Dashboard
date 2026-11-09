import { fmtPeso, isAddOnCategory, paymentMethodKey } from '@/features/sales/utils';

describe('paymentMethodKey', () => {
  test('reports ("cash") and order statuses ("paid_cash") compare equal', () => {
    expect(paymentMethodKey('cash')).toBe('cash');
    expect(paymentMethodKey('paid_cash')).toBe('cash');
    expect(paymentMethodKey('PAID_GCash')).toBe('gcash');
  });
});

describe('fmtPeso', () => {
  test.each([
    [0, '₱0.00'],
    [5, '₱5.00'],
    [999.5, '₱999.50'],
    [1000, '₱1,000.00'],
    [1234567.891, '₱1,234,567.89'],
  ])('%p → %s', (n, text) => {
    expect(fmtPeso(n)).toBe(text);
  });

  test('missing amounts show as zero', () => {
    expect(fmtPeso(undefined)).toBe('₱0.00');
    expect(fmtPeso(null)).toBe('₱0.00');
  });

  test('negative amounts keep the sign (e.g. cash left after expenses)', () => {
    expect(fmtPeso(-1250)).toBe('₱-1,250.00');
  });
});

describe('isAddOnCategory', () => {
  test.each(['Add Ons', 'Add-ons', 'Addons', 'Ad Ons', 'add on'])('%s is an add-on category', (name) => {
    expect(isAddOnCategory(name)).toBe(true);
  });

  test.each(['Wash', 'Dry Clean', '', null, undefined])('%p is not', (name) => {
    expect(isAddOnCategory(name)).toBe(false);
  });
});
