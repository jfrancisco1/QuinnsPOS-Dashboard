import { useEffect, useState } from 'react';

import { getMe, type CurrentUser } from '@/lib/api';

type Props = {
  token: string | null;
};

export function useCurrentUser({ token }: Props) {
  // Tagging the result with the token it was fetched for lets `loading` be
  // derived, instead of resetting state synchronously inside the effect.
  const [result, setResult] = useState<{ token: string; user: CurrentUser | null } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getMe(token).then((res) => {
      if (!cancelled) setResult({ token, user: res.ok ? res.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loaded = token != null && result?.token === token;
  return { user: loaded ? result.user : null, loading: token != null && !loaded };
}
