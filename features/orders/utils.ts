import { type BadgeVariant } from '@/components/ui/badge';

export function paymentVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'paid_cash':
    case 'paid_gcash':
      return 'success';
    case 'unpaid':
      return 'danger';
    case 'partial':
      return 'warning';
    default:
      return 'default';
  }
}

export function paymentLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid_cash':
      return 'Cash';
    case 'paid_gcash':
      return 'GCash';
    default:
      return status ?? '';
  }
}

export function fulfillmentLabel(type: string): string {
  switch (type?.toLowerCase()) {
    case 'delivery':
      return 'Delivery';
    case 'pickup':
      return 'Pickup';
    case 'walk_in':
    case 'walk-in':
      return 'Walk-in';
    default:
      return type ?? '';
  }
}

export function statusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status ?? '';
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
