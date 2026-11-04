import type { Tenant } from '@/lib/api';
import {
  formatPeso,
  isAtLimit,
  parseApiDate,
  paymentStatus,
  planLabel,
  trialDaysLeft,
} from '@/lib/plan';

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 1,
    name: 'Test Shop',
    plan: 'pro',
    effective_plan: 'pro',
    on_trial: false,
    trial_ends_at: null,
    billing_cycle: 'monthly',
    pending_payment: null,
    paid_until: '2026-11-10',
    features: [],
    limits: { max_branches: 1, max_admins: 1, max_staff: 5, max_drivers: 1 },
    ...overrides,
  };
}

const NOW = new Date(2026, 10, 4, 15, 0, 0);

describe('formatPeso / planLabel', () => {
  it('formats pesos with thousands separators', () => {
    expect(formatPeso(7990)).toBe('₱7,990');
  });

  it('capitalizes plan names', () => {
    expect(planLabel('starter')).toBe('Starter');
  });
});

describe('parseApiDate', () => {
  it('accepts "Y-m-d H:i:s" and ISO timestamps', () => {
    expect(parseApiDate('2026-11-04 08:15:00').getTime()).toBe(new Date('2026-11-04T08:15:00').getTime());
    expect(parseApiDate('2026-11-04T08:15:00Z').toISOString()).toBe('2026-11-04T08:15:00.000Z');
  });
});

describe('trialDaysLeft', () => {
  it('is 0 without a trial end date or after it passes', () => {
    expect(trialDaysLeft(tenant(), NOW)).toBe(0);
    expect(trialDaysLeft(tenant({ trial_ends_at: '2026-11-01 00:00:00' }), NOW)).toBe(0);
  });

  it('rounds partial days up', () => {
    expect(trialDaysLeft(tenant({ trial_ends_at: '2026-11-06 09:00:00' }), NOW)).toBe(2);
  });
});

describe('paymentStatus', () => {
  it('is null when paid up, on trial, or not on a paid plan', () => {
    expect(paymentStatus(tenant({ paid_until: '2026-11-10' }), NOW)).toBeNull();
    expect(paymentStatus(tenant({ paid_until: '2026-11-04' }), NOW)).toBeNull();
    expect(paymentStatus(tenant({ on_trial: true, paid_until: '2026-10-01' }), NOW)).toBeNull();
    expect(paymentStatus(tenant({ plan: 'free', paid_until: '2026-10-01' }), NOW)).toBeNull();
    expect(paymentStatus(tenant({ paid_until: null }), NOW)).toBeNull();
  });

  it('is overdue during the grace period', () => {
    expect(paymentStatus(tenant({ paid_until: '2026-11-01' }), NOW)).toEqual({
      kind: 'overdue',
      lastDay: new Date(2026, 10, 8),
      graceDaysLeft: 4,
    });
  });

  it('keeps graceDaysLeft at 0 once the grace period is used up', () => {
    expect(paymentStatus(tenant({ paid_until: '2026-10-20' }), NOW)).toMatchObject({
      kind: 'overdue',
      graceDaysLeft: 0,
    });
  });

  it('is lapsed once the API applies the Free limits', () => {
    expect(paymentStatus(tenant({ paid_until: '2026-10-01', effective_plan: 'free' }), NOW)).toEqual({
      kind: 'lapsed',
    });
  });
});

describe('isAtLimit', () => {
  it('treats null as unlimited', () => {
    expect(isAtLimit(100, null)).toBe(false);
    expect(isAtLimit(2, 3)).toBe(false);
    expect(isAtLimit(3, 3)).toBe(true);
  });
});
