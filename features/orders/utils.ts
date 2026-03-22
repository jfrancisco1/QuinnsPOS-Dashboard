import { type BadgeVariant } from '@/components/ui/badge';

export function paymentVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'unpaid':
      return 'danger';
    case 'partial':
      return 'warning';
    default:
      return 'default';
  }
}

export function statusVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'in_progress':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}
