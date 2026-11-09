import { paymentMethodKey } from '@/features/sales/utils';
import { type SalesByPaymentType } from '@/lib/api';

// Cash payments collected in the period (rows may say "cash" or "paid_cash").
export function cashCollected(salesByPayment: SalesByPaymentType[]): number {
  return salesByPayment
    .filter((row) => paymentMethodKey(row.payment_method) === 'cash')
    .reduce((sum, row) => sum + row.payment_amount, 0);
}

// What should be left in the drawer. Expenses have no payment method yet, so all of them
// are counted as paid out of cash.
export function cashLeft(cash: number, expenseTotal: number): number {
  return cash - expenseTotal;
}
