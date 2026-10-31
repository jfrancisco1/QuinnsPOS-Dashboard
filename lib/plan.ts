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

// A paid shop keeps its plan this many days past paid_until, then the API gives it
// the Free limits until the payment is recorded (API config plans.grace_days).
export const GRACE_DAYS = 7;

export type PaymentStatus =
  // paid_until has passed; the plan keeps working through lastDay.
  | { kind: 'overdue'; lastDay: Date; graceDaysLeft: number }
  // Past the grace period: the API already applies the Free limits.
  | { kind: 'lapsed' };

// paid_until is a plain "Y-m-d" date: read it as local midnight, not UTC.
function parseDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Whether a paid shop owes its payment, or null when it's paid up (or not on a paid plan).
export function paymentStatus(tenant: Tenant, now: Date = new Date()): PaymentStatus | null {
  if (tenant.on_trial || !tenant.paid_until || !(tenant.plan in PLAN_PRICES)) return null;
  if (tenant.effective_plan === 'free') return { kind: 'lapsed' };

  const lastDay = parseDateOnly(tenant.paid_until);
  lastDay.setDate(lastDay.getDate() + GRACE_DAYS);
  const graceDaysLeft = Math.round((lastDay.getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (graceDaysLeft >= GRACE_DAYS) return null;

  return { kind: 'overdue', lastDay, graceDaysLeft: Math.max(0, graceDaysLeft) };
}

export function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

// null means unlimited.
export function isAtLimit(count: number, limit: number | null): boolean {
  return limit != null && count >= limit;
}
