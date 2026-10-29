import type { Tenant } from '@/lib/api';

// Prices in PHP. Yearly = 2 months free.
export const PLAN_PRICES = {
  starter: { name: 'Starter', monthly: 299, yearly: 2990 },
  pro: { name: 'Pro', monthly: 799, yearly: 7990 },
} as const;

export const EXTRA_BRANCH_MONTHLY = 249;

// New shops get this many days of Pro before dropping to Free.
export const TRIAL_DAYS = 30;

export type PaidPlan = keyof typeof PLAN_PRICES;
export type BillingCycle = 'monthly' | 'yearly';

export const STAFF_APP_URL =
  'https://play.google.com/store/apps/details?id=com.kheldiente.quinnlaundryapp';
// Not published yet; screens show a "coming soon" note instead of a link.
export const DRIVER_APP_URL: string | null = null;
// This app, for the logins of admins the owner adds.
export const ADMIN_APP_URL =
  'https://play.google.com/store/apps/details?id=com.jfrancisco2.quinnsposdashboard';

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-US')}`;
}

// API timestamps come as "Y-m-d H:i:s" (or ISO); both parse once the space is a "T".
export function parseApiDate(value: string): Date {
  return new Date(value.includes('T') ? value : value.replace(' ', 'T'));
}

export function formatApiDate(value: string): string {
  return parseApiDate(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function trialDaysLeft(tenant: Tenant, now: Date = new Date()): number {
  if (!tenant.trial_ends_at) return 0;
  const ms = parseApiDate(tenant.trial_ends_at).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

// null means unlimited.
export function isAtLimit(count: number, limit: number | null): boolean {
  return limit != null && count >= limit;
}
