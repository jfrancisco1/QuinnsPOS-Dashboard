import { forwardRef } from 'react';
import { Image, Text, View } from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import { type BadgeVariant } from '@/components/ui/badge';
import { fulfillmentLabel, paymentLabel, paymentVariant, statusLabel, statusVariant } from '@/features/orders/utils';
import { fmtPeso } from '@/features/sales/utils';
import { type Order, type TenantSettings } from '@/lib/api';

type Props = {
  order: Order;
  tenantSettings: TenantSettings | null;
};

// Deliberately light-only (no dark: classes) — this is a rendered "photo of a
// receipt" meant to look the same regardless of the device's system theme.
const chipStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-zinc-100', text: 'text-zinc-600' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-yellow-100', text: 'text-yellow-700' },
  danger: { container: 'bg-red-100', text: 'text-red-700' },
  info: { container: 'bg-blue-100', text: 'text-blue-700' },
};

// The ₱ glyph reliably corrupts when this view is rasterized by react-native-view-shot
// (only in the captured image, never on the live screen) — "PHP" avoids that entirely.
function fmtAmount(n: number | undefined | null): string {
  return fmtPeso(n).replace('₱', 'PHP ');
}

function Chip({ label, variant }: { label: string; variant: BadgeVariant }) {
  const s = chipStyles[variant];
  return (
    <View className={`rounded-full px-3 py-1 ${s.container}`}>
      <Text className={`text-xs font-medium ${s.text}`}>{label}</Text>
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-zinc-600">{label}</Text>
      <Text className="text-sm text-zinc-900">{value}</Text>
    </View>
  );
}

export const OrderReceiptCard = forwardRef<View, Props>(function OrderReceiptCard({ order, tenantSettings }, ref) {
  const items = order.items ?? [];

  const branchAddress = order.branch?.address ?? tenantSettings?.branchAddressOverride ?? null;
  const contactNumber = tenantSettings?.contactNumber ?? order.branch?.phone ?? null;
  const emailSocial = [tenantSettings?.email, tenantSettings?.socialHandle].filter(Boolean).join(' · ');

  const isDelivery = order.fulfillmentType?.toLowerCase() === 'delivery';
  const isPaid = order.paymentStatus?.toLowerCase().startsWith('paid_');
  const isUnpaid = order.paymentStatus?.toLowerCase() === 'unpaid';
  const showGcashQr = isUnpaid && !!tenantSettings?.gcashNumber;

  const footerLines = [tenantSettings?.claimPolicyText, tenantSettings?.disclaimerText, tenantSettings?.thankYouText].filter(
    (line): line is string => !!line,
  );

  return (
    <View ref={ref} collapsable={false} className="w-[624px] bg-zinc-100 p-8">
      <View className="overflow-hidden rounded-2xl bg-white">
        {/* Header band */}
        <View className="items-center border-b border-zinc-100 bg-white px-8 pb-10 pt-11">
          <Image
            source={require('@/assets/images/ios-light.png')}
            style={{ width: 64, height: 64, borderRadius: 16 }}
            resizeMode="contain"
          />
          <Text style={{ fontFamily: 'Ceoruse' }} className="mt-4 text-2xl text-primary">
            QUINNS
          </Text>
          <Text className="mt-5 text-sm font-medium text-zinc-500">
            {new Date(order.createdAt).toLocaleString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </Text>
          {!!tenantSettings?.businessName && (
            <Text className="mt-3 text-sm font-semibold text-zinc-700">{tenantSettings.businessName}</Text>
          )}
          {!!branchAddress && (
            <Text className="mt-1 text-center text-xs text-zinc-500">{branchAddress}</Text>
          )}
          {!!contactNumber && <Text className="mt-1 text-xs text-zinc-500">{contactNumber}</Text>}
          {!!emailSocial && <Text className="mt-1 text-xs text-zinc-500">{emailSocial}</Text>}
        </View>

        {/* Body */}
        <View className="p-8">
          <View className="mb-6">
            <Text className="text-xl font-bold text-zinc-900" numberOfLines={1}>
              {order.customer?.nickname?.toUpperCase() ?? '—'}
            </Text>
            <Text className="mt-1.5 text-sm text-zinc-500">
              {fulfillmentLabel(order.fulfillmentType)} · {order.branch?.name ?? '—'}
            </Text>
            <View className="mt-4 flex-row gap-2.5">
              <Chip label={paymentLabel(order.paymentStatus)} variant={paymentVariant(order.paymentStatus)} />
              <Chip label={statusLabel(order.orderStatus)} variant={statusVariant(order.orderStatus)} />
            </View>
            {!!order.customer?.mobile && (
              <Text className="mt-3 text-sm text-zinc-600">Contact: {order.customer.mobile}</Text>
            )}
            {isDelivery && !!order.customer?.address && (
              <Text className="mt-1 text-sm text-zinc-600">Deliver to: {order.customer.address}</Text>
            )}
          </View>

          {/* Items */}
          <View className="border-t border-zinc-100">
            {items.length === 0 ? (
              <Text className="py-4 text-sm text-zinc-500">No items</Text>
            ) : (
              items.map((item, i) => (
                <View key={i} className="flex-row items-center justify-between border-b border-zinc-100 py-3.5">
                  <Text className="flex-1 pr-4 text-sm text-zinc-800">
                    {item.label}
                    {item.qty > 1 ? ` ×${item.qty}` : ''}
                  </Text>
                  <Text className="text-sm font-medium text-zinc-900">
                    {fmtAmount(Number(item.price) * item.qty)}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Totals */}
          <View className="mt-4">
            <TotalRow label="Subtotal" value={fmtAmount(order.subtotal)} />
            <TotalRow label="Delivery Fee" value={fmtAmount(order.deliveryFee)} />
            <View className="mt-3 flex-row justify-between border-t border-zinc-100 pt-4">
              <Text className="text-base font-bold text-zinc-900">Total</Text>
              <Text className="text-xl font-bold text-primary">{fmtAmount(order.total)}</Text>
            </View>

            {/* Payment */}
            <View className="mt-4 border-t border-zinc-100 pt-4">
              {isPaid && (
                <>
                  <TotalRow label="Payment Method" value={paymentLabel(order.paymentStatus)} />
                  <TotalRow label="Amount Paid" value={fmtAmount(order.total)} />
                </>
              )}
              {isUnpaid && (
                <View className="flex-row justify-between py-1.5">
                  <Text className="text-sm font-bold text-red-600">Balance Due</Text>
                  <Text className="text-base font-bold text-red-600">{fmtAmount(order.total)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* GCash QR */}
          {showGcashQr && (
            <View className="mt-6 items-center border-t border-zinc-100 pt-6">
              <Text className="text-sm font-semibold text-zinc-700">Pay via GCash</Text>
              <View className="mt-3">
                <QRCode value={`GCash: ${tenantSettings!.gcashName} — ${tenantSettings!.gcashNumber}`} size={120} />
              </View>
              {!!tenantSettings?.gcashName && (
                <Text className="mt-3 text-sm text-zinc-700">{tenantSettings.gcashName}</Text>
              )}
              {!!tenantSettings?.gcashNumber && (
                <Text className="text-sm text-zinc-500">{tenantSettings.gcashNumber}</Text>
              )}
            </View>
          )}

          {/* Footer */}
          {footerLines.length > 0 && (
            <View className="mt-6 items-center border-t border-zinc-100 pt-4">
              {footerLines.map((line, i) => (
                <Text key={i} className="mt-1 text-center text-xs text-zinc-400">
                  {line}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
});
