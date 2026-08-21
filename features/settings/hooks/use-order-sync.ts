import { useCallback, useEffect, useState } from 'react';

import { getOrders } from '@/lib/api';
import { getPreference, setPreference } from '@/lib/preferences-store';

const LAST_SYNCED_KEY = 'orders_last_synced_at';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

type Props = {
  token: string | null;
};

export function useOrderSync({ token }: Props) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getPreference(LAST_SYNCED_KEY).then((stored) => {
      if (stored) setLastSyncedAt(new Date(stored));
    });
  }, []);

  const sync = useCallback(async () => {
    if (!token || status === 'syncing') return;

    setStatus('syncing');
    setErrorMessage(null);

    const result = await getOrders(token, {});

    if (result.ok) {
      const now = new Date();
      setLastSyncedAt(now);
      setPreference(LAST_SYNCED_KEY, now.toISOString());
      setStatus('success');
    } else {
      setErrorMessage(result.error.message);
      setStatus('error');
    }
  }, [token, status]);

  return { status, lastSyncedAt, errorMessage, sync };
}
