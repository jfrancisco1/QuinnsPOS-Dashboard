import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getBranches, type Branch } from '@/lib/api';

// Active branches, reloaded whenever the screen regains focus (after add/edit).
export function useBranchList(token: string | null) {
  const [result, setResult] = useState<{ token: string; branches: Branch[]; error: string | null } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      getBranches(token).then((res) => {
        if (cancelled) return;
        setResult({
          token,
          branches: res.ok ? res.data.filter((b) => b.is_active) : [],
          error: res.ok ? null : res.error.message,
        });
      });
      return () => {
        cancelled = true;
      };
    }, [token]),
  );

  const loaded = token != null && result?.token === token;
  return {
    branches: loaded ? result.branches : [],
    error: loaded ? result.error : null,
    loading: token != null && !loaded,
  };
}
