import { useCallback, useEffect, useState } from 'react';

import { getStore, type Store } from '@/lib/api';

type Props = {
  token: string | null;
};

export function useStore({ token }: Props) {
  // Tagging the result with the token it was fetched for lets `loading` be
  // derived, instead of resetting state synchronously inside the effect.
  const [result, setResult] = useState<{ token: string; store: Store | null } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getStore(token).then((res) => {
      if (!cancelled) setResult({ token, store: res.ok ? res.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const setStore = useCallback(
    (store: Store | null) => {
      if (token) setResult({ token, store });
    },
    [token],
  );

  const loaded = token != null && result?.token === token;
  return { store: loaded ? result.store : null, loading: token != null && !loaded, setStore };
}
