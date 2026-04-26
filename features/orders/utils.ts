import { type BadgeVariant } from '@/components/ui/badge';

export function paymentVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'paid_cash':
    case 'paid_gcash':
    case 'paid_bank':
    case 'paid_others':
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
    case 'paid_bank':
      return 'Bank';
    case 'paid_others':
      return 'Others';
    case 'paid':
      return 'Paid';
    case 'unpaid':
      return 'Unpaid';
    case 'partial':
      return 'Partial';
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
    case 'ready':
      return 'Ready';
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
      return 'warning';
    case 'ready':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}
