import { useEffect, useState } from 'react';

import { getTenantSettings, type TenantSettings } from '@/lib/api';

type Props = {
  token: string | null;
};

export function useTenantSettings({ token }: Props) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getTenantSettings(token).then((result) => {
      setSettings(result.ok ? result.data : null);
      setLoading(false);
    });
  }, [token]);

  return { settings, loading };
}
