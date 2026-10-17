import { Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNetworkStatus } from '@/lib/network-status';

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return time;
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day}, ${time}`;
}

export function OfflineBanner() {
  const { isOffline, serverUnreachable, showingCachedSince } = useNetworkStatus();
  if (!isOffline && !serverUnreachable) return null;

  const title = isOffline ? "You're offline" : "Can't reach the server";
  const detail = showingCachedSince
    ? `Showing data saved ${formatSavedAt(showingCachedSince)}`
    : 'Some data may be missing';

  return (
    <View className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-white/20 px-3 py-2">
      <IconSymbol name="wifi.slash" size={14} color="#fff" />
      <Text className="text-xs font-semibold text-white" numberOfLines={1}>
        {title} · <Text className="font-normal">{detail}</Text>
      </Text>
    </View>
  );
}
