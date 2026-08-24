import { useCallback, useEffect, useState } from 'react';

import { getStore, type Store } from '@/lib/api';

type Props = {
  token: string | null;
};

export function useStore({ token }: Props) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!token) {
      setStore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getStore(token).then((result) => {
      setStore(result.ok ? result.data : null);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { store, loading, refetch, setStore };
}
