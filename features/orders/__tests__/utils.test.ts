import { fulfillmentLabel, paymentLabel, paymentVariant, statusLabel, statusVariant } from '@/features/orders/utils';

describe('paymentLabel / paymentVariant', () => {
  test.each([
    ['paid_cash', 'Cash', 'success'],
    ['paid_gcash', 'GCash', 'info'],
    ['paid_bank', 'Bank', 'success'],
    ['paid_others', 'Others', 'success'],
    ['paid', 'Paid', 'success'],
    ['unpaid', 'Unpaid', 'danger'],
    ['partial', 'Partial', 'warning'],
  ])('%s → %s (%s)', (status, label, variant) => {
    expect(paymentLabel(status)).toBe(label);
    expect(paymentVariant(status)).toBe(variant);
  });

  test('is case-insensitive', () => {
    expect(paymentLabel('PAID_GCASH')).toBe('GCash');
    expect(paymentVariant('Unpaid')).toBe('danger');
  });

  test('an unknown status is shown as-is with the neutral badge', () => {
    expect(paymentLabel('paid_crypto')).toBe('paid_crypto');
    expect(paymentVariant('paid_crypto')).toBe('default');
  });
});

describe('fulfillmentLabel', () => {
  test.each([
    ['walk_in', 'Walk-in'],
    ['walk-in', 'Walk-in'],
    ['pickup_deliver', 'Pickup & Delivery'],
    ['pickup-deliver', 'Pickup & Delivery'],
    ['delivery', 'Delivery'],
    ['pickup', 'Pickup'],
  ])('%s → %s', (type, label) => {
    expect(fulfillmentLabel(type)).toBe(label);
  });
});

describe('statusLabel / statusVariant', () => {
  test.each([
    ['pending', 'Pending', 'warning'],
    ['in_progress', 'In Progress', 'warning'],
    ['ready', 'Ready', 'info'],
    ['completed', 'Completed', 'success'],
    ['cancelled', 'Cancelled', 'danger'],
  ])('%s → %s (%s)', (status, label, variant) => {
    expect(statusLabel(status)).toBe(label);
    expect(statusVariant(status)).toBe(variant);
  });
});
