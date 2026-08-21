import { useEffect, useState } from 'react';

import { getMe, type CurrentUser } from '@/lib/api';

type Props = {
  token: string | null;
};

export function useCurrentUser({ token }: Props) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getMe(token).then((result) => {
      setUser(result.ok ? result.data : null);
      setLoading(false);
    });
  }, [token]);

  return { user, loading };
}
