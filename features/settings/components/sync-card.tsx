import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { SyncStatus } from '@/features/settings/hooks/use-order-sync';

type Props = {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  onSync: () => void;
};

function formatLastSynced(date: Date): string {
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today at ${time}`;
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day} at ${time}`;
}

export function SyncCard({ status, lastSyncedAt, errorMessage, onSync }: Props) {
  const syncing = status === 'syncing';

  let statusLine: string;
  if (syncing) {
    statusLine = 'Syncing…';
  } else if (status === 'error') {
    statusLine = errorMessage ? `Sync failed: ${errorMessage}` : 'Sync failed';
  } else if (lastSyncedAt) {
    statusLine = `Last synced: ${formatLastSynced(lastSyncedAt)}`;
  } else {
    statusLine = 'Not synced yet';
  }

  return (
    <Card title="Orders">
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-sm font-medium text-ink dark:text-white">Sync orders</Text>
          <Text
            className={`mt-0.5 text-xs ${
              status === 'error' ? 'text-red-500 dark:text-red-400' : 'text-muted'
            }`}
          >
            {statusLine}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onSync}
          disabled={syncing}
          activeOpacity={0.8}
          className={`flex-row items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 ${
            syncing ? 'opacity-60' : ''
          }`}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="arrow.triangle.2.circlepath" size={16} color="#fff" />
          )}
          <Text className="text-xs font-semibold text-white">
            {syncing ? 'Syncing' : 'Sync now'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}
