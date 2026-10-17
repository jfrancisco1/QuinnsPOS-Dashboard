import { useSyncExternalStore } from 'react';

import NetInfo from '@react-native-community/netinfo';

// App-wide connectivity state. Combines the OS's view (NetInfo) with what the
// API client actually experienced, since a device can be "connected" while the
// server is unreachable (captive portal, Railway outage, dead Wi-Fi).

export type NetworkStatus = {
  // OS reports no connection.
  isOffline: boolean;
  // The most recent API request failed at the network level.
  serverUnreachable: boolean;
  // Oldest cached response shown since the last live response, if any.
  showingCachedSince: string | null;
  // Bumps each time connectivity is restored; add to effect deps to refetch.
  reconnectKey: number;
};

let state: NetworkStatus = {
  isOffline: false,
  serverUnreachable: false,
  showingCachedSince: null,
  reconnectKey: 0,
};

const listeners = new Set<() => void>();

function update(patch: Partial<NetworkStatus>) {
  const next = { ...state, ...patch };
  if (
    next.isOffline === state.isOffline &&
    next.serverUnreachable === state.serverUnreachable &&
    next.showingCachedSince === state.showingCachedSince &&
    next.reconnectKey === state.reconnectKey
  ) {
    return;
  }
  state = next;
  listeners.forEach((l) => l());
}

NetInfo.addEventListener((info) => {
  const isOffline = info.isConnected === false || info.isInternetReachable === false;
  if (state.isOffline && !isOffline) {
    update({ isOffline, reconnectKey: state.reconnectKey + 1 });
  } else {
    update({ isOffline });
  }
});

export function reportLiveResponse() {
  update({ serverUnreachable: false, showingCachedSince: null });
}

export function reportNetworkFailure(cachedSavedAt: string | null) {
  const current = state.showingCachedSince;
  const showingCachedSince =
    cachedSavedAt && (!current || cachedSavedAt < current) ? cachedSavedAt : current;
  update({ serverUnreachable: true, showingCachedSince });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useReconnectKey(): number {
  return useNetworkStatus().reconnectKey;
}
